using System;
using dotenv.net;

namespace datahubIndexer
{
    public class Env
    {
        static Env() { } // singleton to avoid reading a variable more than once
        private static readonly Env env = new Env();

        public string AwsRegion              { get; private set; }
        public string AwsAccessKeyId         { get; private set; }
        public string AwsSecretAccessKey     { get; private set; }
        public string EsIndex                { get; private set; }
        public string EsSite                 { get; private set; }
        public string DynamoDbTable          { get; private set; }
        public string LambdaFunction         { get; private set; }
        public string DatahubAssetsUrl       { get; private set; }
        public bool UseLocalstack            { get; private set; } = false; 
        public int AssetQueryDelay           { get; private set; } = 0;

        public Env()
        {
            DotEnv.Config();

            AwsRegion = GetVariable("AWS_DEFAULT_REGION");
            AwsAccessKeyId = GetVariable("AWS_ACCESS_KEY_ID");
            AwsSecretAccessKey = GetVariable("AWS_SECRET_ACCESS_KEY");
            EsIndex = GetVariable("ES_INDEX");
            EsSite = GetVariable("ES_SITE");
            DynamoDbTable = GetVariable("DYNAMODB_TABLE");
            LambdaFunction = GetVariable("LAMBDA_FUNCTION");
            DatahubAssetsUrl = GetVariable("DATAHUB_ASSETS_URL");
            UseLocalstack = Boolean.Parse(GetVariable("USE_LOCALSTACK"));
            AssetQueryDelay = Int32.Parse(GetVariable("ASSET_QUERY_DELAY"));
        }

        string GetVariable(string variable)
        {
            return Environment.GetEnvironmentVariable(variable)
                ?? throw new Exception($"The environment variable {variable} couldn't be read. You may need to define it in your .env file.");
        }

        public static Env Var
        {
            get { return env; }
        }
    }
}