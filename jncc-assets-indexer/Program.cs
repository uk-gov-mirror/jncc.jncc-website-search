using System;
using System.IO;
using System.Threading.Tasks;
using Amazon;
using Amazon.S3;
using Amazon.SQS;
using Amazon.SQS.Model;
using Amazon.Runtime;
using Amazon.SQS.ExtendedClient;
using Newtonsoft.Json;
using dotenv.net;
using System.Linq;
using System.Collections.Generic;
using System.Net;
using CsvHelper;
using System.Threading;
using System.Globalization;

namespace assetIndexer
{
    class Program
    {
        public static void Main(string[] args)
        {
            ProcessAssetLists();
        }

        static void ProcessAssetLists()
        {
            Console.WriteLine("sqs endpoint: {0}", Env.Var.SqsEndpoint);
            Console.WriteLine("sqs s3 bucket", Env.Var.SqsPayloadBucket);

            int errors = 0;

            using(var s3 = GetS3Client())
            using(var sqs = GetSQSClient())
            using(var sqsExtendedClient = new AmazonSQSExtendedClient(sqs,
                new ExtendedClientConfiguration().WithLargePayloadSupportEnabled(s3, Env.Var.SqsPayloadBucket)
            ))
            {
                foreach (var assetListUrl in Env.Var.AssetListUrls)
                {
                    Console.WriteLine("Processing {0}", assetListUrl);

                    List<Asset> assets;

                    try
                    {
                        assets = GetAssetList(assetListUrl);
                    }
                    catch (Exception e)
                    {
                        Console.WriteLine("Unable to get asset list from {0}. Error: {1}", assetListUrl, e.Message);
                        errors++;
                        continue;
                    }
              
                    for (int i = 0; i < assets.Count; i++)
                    {
                        var asset = assets[i];
                        
                        Console.WriteLine("Processing Asset {0}, {1} {2}", i, asset.Id, asset.Title);

                        if (AssetValidator.IsValid(asset, errors))
                        {
                            var assetFileUrl = GetFileUrl(assetListUrl, asset.FileName);
                            
                            AssetFile file; 
                            try
                            {
                                file = GetAssetFile(assetFileUrl, asset);
                            }
                            catch (Exception e)
                            {
                                Console.WriteLine("Unable to get asset file from {0}. Error: {1}", assetFileUrl, e.Message);
                                errors++;
                                continue;
                            }
                            
                            var culture = CultureInfo.CreateSpecificCulture("en-GB");
                            var style = DateTimeStyles.None;

                            var message = new
                            {
                                verb = "upsert",
                                index = Env.Var.EsIndex,
                                document = new
                                {
                                    id = asset.Id,
                                    site = Env.Var.EsSite,
                                    title = asset.Title,
                                    url = file.Url,
                                    published_date = DateTime.Parse(asset.PublicationDate, culture, style).ToString("yyyy-MM-dd'T'HH':'mm':'ss"),
                                    file_base64 = file.EncodedFile, // base-64 encoded file
                                    file_extension = file.Extension,   // when this is a downloadable
                                    file_bytes = file.Bytes.ToString(),   // file such as a PDF, etc.
                                }
                            };

                            Console.WriteLine("calling sqs endpoint: {0}", Env.Var.SqsEndpoint);
                            
                            var response = sqsExtendedClient.SendMessageAsync(Env.Var.SqsEndpoint,
                                JsonConvert.SerializeObject(message, Formatting.None)
                            ).GetAwaiter().GetResult();

                            Console.WriteLine("Created Message Id {0}", response.MessageId);

                            if (Env.Var.AssetQueryDelay > 0)
                            {
                                Console.WriteLine("Waiting {0}ms before getting next asset", Env.Var.AssetQueryDelay);
                                Thread.Sleep(Env.Var.AssetQueryDelay);
                            }
                        }
                    }
                };
            }

            if (errors > 0)
            {
                // Throw an error if there have been any non breaking issues so the jenkins job fails
                throw new Exception(String.Format("{0} errors occured during processing", errors));
            }
        }

        static AmazonSQSClient GetSQSClient()
        {
            if (Env.Var.UseLocalstack)
            {
                return new AmazonSQSClient(new AmazonSQSConfig {
                    ServiceURL = "http://localhost:4576",
                });
            }
            else
            {
                return new AmazonSQSClient(
                    new BasicAWSCredentials(Env.Var.AwsAccessKeyId, Env.Var.AwsSecretAccessKey), 
                    RegionEndpoint.GetBySystemName(Env.Var.AwsRegion));
            }
        }

        static AmazonS3Client GetS3Client()
        {
            if (Env.Var.UseLocalstack) 
            {
                return new AmazonS3Client(new AmazonS3Config {
                    ServiceURL = "http://localhost:4572",
                    ForcePathStyle = true,
                });
            }
            else 
            {
                return new AmazonS3Client(
                    new BasicAWSCredentials(Env.Var.AwsAccessKeyId, Env.Var.AwsSecretAccessKey), 
                    RegionEndpoint.GetBySystemName(Env.Var.AwsRegion));
            }
        }

        static List<Asset> GetAssetList(string assetListUrl)
        {
            var assets = new List<Asset>();

            using (var stream = new WebClient().OpenRead(assetListUrl))
            using (var reader = new StreamReader(stream))
            using (var csv = new CsvReader(reader))
            {
                assets.AddRange(csv.GetRecords<Asset>());
            }

            return assets;
        }

        static AssetFile GetAssetFile(string assetFileUrl, Asset asset)
        {
            var assetFile = new AssetFile();

            using (var stream = new WebClient().OpenRead(assetFileUrl))
            using (var memstream = new MemoryStream())
            {
                stream.CopyTo(memstream);
                assetFile.Extension = Path.GetExtension(asset.FileName);
                assetFile.Bytes = memstream.Length;
                assetFile.EncodedFile = Convert.ToBase64String(memstream.ToArray());
                assetFile.Url = assetFileUrl;
            }

            return assetFile;
        }

        static string GetFileUrl(string url, string fileName)
        {
            var uri = new Uri(url);
            return uri.AbsoluteUri.Remove(uri.AbsoluteUri.Length - uri.Segments.Last().Length) + fileName;
        }
    }
}