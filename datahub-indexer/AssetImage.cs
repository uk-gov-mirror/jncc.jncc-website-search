using System.Collections.Generic;

namespace datahubIndexer
{
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
}