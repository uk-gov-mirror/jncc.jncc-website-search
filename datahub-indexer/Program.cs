using System;
using System.IO;
using Amazon;
using Amazon.Runtime;
using System.Collections.Generic;
using System.Net;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.DynamoDBv2.DataModel;
using Newtonsoft.Json;
using System.Threading;
using Amazon.Lambda;
using Amazon.Lambda.Model;
using Newtonsoft.Json.Serialization;
using CommandLine;

namespace datahubIndexer
{
    class Program
    {
        public class Options {
            [Option('a', "assetId", Required = false, HelpText = "Asset GUID to be indexed")]
            public string AssetId { get; set; }
        }

        public static void Main(string[] args)
        {
            Parser.Default.ParseArguments<Options>(args).WithParsed<Options>(o => Run(o));
        }

        static void Run(Options opts)
        {
            Console.WriteLine($"DynamoDB table {Env.Var.DynamoDbTable}");
            Console.WriteLine($"Lambda function {Env.Var.LambdaFunction}");

            if (opts.AssetId != null && !string.IsNullOrWhiteSpace(opts.AssetId)) {
                IndexAsset(opts.AssetId);
            } else {
                IndexAllAssets();
            }
        }

        static void IndexAsset(string id) {
            Console.WriteLine($"Starting indexing for asset {id}");

            Asset asset;
            try
            {
                asset = GetAsset(id);
            }
            catch (Exception e)
            {
                Console.WriteLine("Unable to get asset from dynamo. Error: {0}", e.Message);
                throw e;
            }

            foreach (var data in asset.Data) {
                try {
                    ProcessDataFile(data);
                }
                catch (Exception e)
                {
                    Console.WriteLine($"Unable to get base 64 encoding for resource {data.Title}. Error: {e.Message}");
                    continue;
                }
            }

            try {
                SendToLambda(asset);
            } catch (Exception e) {
                Console.WriteLine($"Unable to invoke lambda for asset {asset.Id}. Error: {e.Message}");
                throw e;
            }
        }

        static void IndexAllAssets() {
            Console.WriteLine("Starting indexing for all datahub assets");

            int errors = 0;
            List<Asset> assets;

            try
            {
                assets = GetAssets();
            }
            catch (Exception e)
            {
                Console.WriteLine("Unable to get assets from dynamo. Error: {0}", e.Message);
                throw e;
            }

            for (int i = 0; i < assets.Count; i++) {
                var asset = assets[i];
                Console.WriteLine($"Processing asset {i}, {asset.Id} {asset.Metadata.Title}");

                foreach (var data in asset.Data) {
                    try {
                        ProcessDataFile(data);
                    }
                    catch (Exception e)
                    {
                        Console.WriteLine($"Unable to get base 64 encoding for resource {data.Title}. Error: {e.Message}");
                        errors++;
                        continue;
                    }
                }

                try {
                    SendToLambda(asset);
                } catch (Exception e) {
                    Console.WriteLine($"Unable to invoke lambda for asset {asset.Id}. Error: {e.Message}");
                    errors++;
                    continue;
                }
            }

            if (errors > 0)
            {
                throw new Exception($"{errors} errors occured during processing");
            }
            else
            {
                Console.WriteLine($"Indexing Completed for {assets.Count} assets, no errors");
            }
        }

        static void ProcessDataFile(AssetData data) {
             if (data.Http.FileExtension != null && data.Http.FileExtension.ToLower().Equals("pdf") && data.Http.FileBytes > 0) {
                var url = new Uri(data.Http.Url);
                
                Console.WriteLine($"Getting base 64 encoding of {url}");
                data.Http.FileBase64 = GetBase64Encoding(url);

                if (Env.Var.AssetQueryDelay > 0)
                {
                    Console.WriteLine("Waiting {0}ms before getting next asset", Env.Var.AssetQueryDelay);
                    Thread.Sleep(Env.Var.AssetQueryDelay);
                }
            }
        }

        static void SendToLambda(Asset asset) {
            var message = new {
                config = new {
                    elasticsearch = new {
                        index = Env.Var.EsIndex,
                        site = Env.Var.EsSite
                    },
                    hub = new {
                        baseUrl = Env.Var.DatahubAssetsUrl
                    },
                    dynamo = new {
                        table = Env.Var.DynamoDbTable
                    },
                    sqs = new {
                        queueEndpoint = Env.Var.SqsEndpoint,
                        largeMessageBucket = Env.Var.SqsPayloadBucket
                    },
                    action = "reindex"
                },
                asset = asset
            };

            var messageString = JsonConvert.SerializeObject(message, new JsonSerializerSettings{
                ContractResolver = new CamelCasePropertyNamesContractResolver(),
                NullValueHandling = NullValueHandling.Ignore
            });

            // Console.WriteLine($"Sending message {messageString}");
            var response = InvokeLambda(messageString);

            if (response != null && response.StatusCode == 200 && response.FunctionError == null) {
                Console.WriteLine($"Successfully invoked {Env.Var.LambdaFunction} lambda for {asset.Id}");
            } else {
                throw new Exception($"Something went wrong while invoking {Env.Var.LambdaFunction} lambda, {response.StatusCode} {response.FunctionError}");
            }
        }

        static AmazonDynamoDBClient GetDynamoDBClient() {
            if (Env.Var.UseLocalstack)
            { 
                return new AmazonDynamoDBClient(new AmazonDynamoDBConfig {
                    ServiceURL = "http://localhost:4569"
                });
            } else {
                return new AmazonDynamoDBClient(
                    new BasicAWSCredentials(Env.Var.AwsAccessKeyId, Env.Var.AwsSecretAccessKey),
                    RegionEndpoint.GetBySystemName(Env.Var.AwsRegion));
            }
        }

        static AmazonLambdaClient GetAmazonLambdaClient() {
            if (Env.Var.UseLocalstack)
            { 
                return new AmazonLambdaClient(new AmazonLambdaConfig {
                    ServiceURL = "http://localhost:4574"
                });
            } else {
                return new AmazonLambdaClient(
                    new BasicAWSCredentials(Env.Var.AwsAccessKeyId, Env.Var.AwsSecretAccessKey),
                    RegionEndpoint.GetBySystemName(Env.Var.AwsRegion));
            }
        }

        static Asset GetAsset(string id)
        {
            Console.WriteLine($"Retrieving asset {id} from dynamo");

            using (var client = GetDynamoDBClient())
            using (var context = new DynamoDBContext(client)) {
                var assetTable = Table.LoadTable(client, Env.Var.DynamoDbTable);
                var result = assetTable.GetItemAsync(id).Result;
                var asset = JsonConvert.DeserializeObject<Asset>(result.ToJson());
                Console.WriteLine($"{asset.Id} {asset.Metadata.Title}");
                return asset;
            }
        }
        static List<Asset> GetAssets()
        {
            Console.WriteLine("Getting asset list");
            var assets = new List<Asset>();

            using (var client = GetDynamoDBClient())
            using (var context = new DynamoDBContext(client)) {
                var assetTable = Table.LoadTable(client, Env.Var.DynamoDbTable);
                var results = assetTable.Scan(new ScanFilter()).GetRemainingAsync().Result;

                foreach (var result in results) {
                    var asset = JsonConvert.DeserializeObject<Asset>(result.ToJson());
                    Console.WriteLine($"{asset.Id} {asset.Metadata.Title}");
                    assets.Add(asset);
                }
            }

            return assets;
        }

        static string GetBase64Encoding(Uri url)
        {
            string base64Encoding;

            using (var stream = new WebClient().OpenRead(url))
            using (var memstream = new MemoryStream())
            {
                stream.CopyTo(memstream);
                base64Encoding = Convert.ToBase64String(memstream.ToArray());
            }

            return base64Encoding;
        }

        static InvokeResponse InvokeLambda(string payload) {
            using (var client = GetAmazonLambdaClient()) {
                var request = new InvokeRequest() {
                    FunctionName = Env.Var.LambdaFunction,
                    Payload = payload
                };

                return client.InvokeAsync(request).Result;
            }
        }
    }
}