namespace datahubIndexer
{
    public class AssetFile
    {
        public long FileBytes { get; set; }
        public string FileExtension { get; set; }

        public string Url { get; set; }
        public string FileBase64 { get; set; }
    }
}
