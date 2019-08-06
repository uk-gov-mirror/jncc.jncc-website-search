using System.Collections.Generic;

namespace datahubIndexer
{
    public class Asset
    {
        public string Id { get; set; }
        public AssetMetadata Metadata { get; set; }
        public List<AssetData> Data { get; set; }
        public string DigitalObjectIdentifier { get; set; }
        public string Citation { get; set; }
        public AssetImage Image { get; set; }
    }
}