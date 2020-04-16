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

    public class AssetData
    {
        public AssetFile Http { get; set; }
        public string Title { get; set; }
    }

    public class AssetFile
    {
        public long FileBytes { get; set; }
        public string FileExtension { get; set; }

        public string Url { get; set; }
        public string FileBase64 { get; set; }
    }

    public class AssetImage
    {
        public string Url { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
        public ImageCrop Crop { get; set; }
    }

    public class ImageCrop {
        public string SquareUrl { get; set; }
        public string ThumbnailUrl { get; set; }
    }
    
    public class AssetMetadata {
        public string Title { get; set; }
        public string Abstract { get; set; }
        public string TopicCategory { get; set; }
        public List<Keywords> Keywords { get; set; }
        public TemporalExtent TemporalExtent { get; set; }
        public string DatasetReferenceDate { get; set; }
        public string Lineage { get; set; }
        public string DataFormat { get; set; }
        public ResponsibleParty ResponsibleOrganisation { get; set; }
        public string LimitationsOnPublicAccess { get; set; }
        public string UseConstraints { get; set; }
        public string SpatialReferenceSystem { get; set; }
        public string MetadataDate { get; set; }
        public ResponsibleParty MetadataPointOfContact { get; set; }
        public string ResourceType { get; set; }
        public string MetadataLanguage { get; set; }
        public BoundingBox BoundingBox { get; set; }
    }

    public class Keywords {
        public string Value { get; set; }
        public string Vocab { get; set; }
    }

    public class TemporalExtent {
        public string Begin { get; set; }
        public string End { get; set; }
    }

    public class ResponsibleParty {
        public string Name { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
    }

    public class BoundingBox {
        public decimal East { get; set; }
        public decimal North { get; set; }
        public decimal South { get; set; }
        public decimal West { get; set; }
    }
}