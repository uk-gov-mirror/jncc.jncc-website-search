using System.Collections.Generic;

namespace datahubIndexer
{
    public class Asset
    {
        public string Id { get; set; }
        public AssetMetadata Metadata { get; set; }
        public List<AssetData> Data { get; set; }
    }
}