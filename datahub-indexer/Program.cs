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

namespace datahubIndexer
{
    class Program
    {
        public static void Main(string[] args)
        {
            ReindexDatahub();
        }

        static void ReindexDatahub()
        {
            Console.WriteLine("DynamoDB table", Env.Var.DynamoDbTable);

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
                Console.WriteLine($"Processing Asset {i}, {asset.Id} {asset.Metadata.Title}");

                foreach (var data in asset.Data) {
                    if (data.Http.FileExtension != null && data.Http.FileExtension.ToLower().Equals("pdf") && data.Http.FileBytes > 0) {
                        var url = new Uri(data.Http.Url);
                        
                        try
                        {
                            Console.WriteLine($"Getting base 64 encoding of {url}");
                            data.Http.FileBase64 = GetBase64Encoding(url);

                            if (Env.Var.AssetQueryDelay > 0)
                            {
                                Console.WriteLine("Waiting {0}ms before getting next asset", Env.Var.AssetQueryDelay);
                                Thread.Sleep(Env.Var.AssetQueryDelay);
                            }
                        }
                        catch (Exception e)
                        {
                            Console.WriteLine($"Unable to get base 64 encoding for {url}. Error: {e.Message}");
                            errors++;
                            continue;
                        }
                    }
                }
            }

            if (errors > 0)
            {
                Console.WriteLine("{0} errors occured during processing", errors);
            }
            else
            {
                Console.WriteLine("Indexing Complete, no errors");
            }
        }

        static AmazonDynamoDBClient GetDynamoDBClient() {
            // if (Env.Var.UseLocalstack)
            // { 
            //     return new AmazonDynamoDBClient(new AmazonDynamoDBConfig {
            //         ServiceURL = "http://localhost:4569"
            //     });
            // } else {
                return new AmazonDynamoDBClient(
                    new BasicAWSCredentials(Env.Var.AwsAccessKeyId, Env.Var.AwsSecretAccessKey),
                    RegionEndpoint.GetBySystemName(Env.Var.AwsRegion));
            // }
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
    }
}