using System;
using System.Globalization;

namespace assetIndexer
{
    public static class AssetValidator
    {
        public static bool IsValid(Asset asset, int errors)
        {
            var isValid = true;

            if (! ValidateId(asset)) {
                isValid = false;
                errors++;
            }

            if (! ValidateTitle(asset)) {
                isValid = false;
                errors++;
            }

            if (! ValidatePublishedDate(asset)) {
                isValid = false;
                errors++;
            }

            if (! ValidateFileName(asset)) {
                isValid = false;
                errors++;
            }

            return isValid;
        }

        private static bool ValidateFileName(Asset asset)
        {
            if (String.IsNullOrWhiteSpace(asset.FileName))
            {
                Console.WriteLine("Asset filename not defined");
                return false;
            }
            else
            {
                return true;
            } 
        }

        //todo -- add validation
        private static bool ValidatePublishedDate(Asset asset)
        {
            DateTime val;
        
            var culture = CultureInfo.CreateSpecificCulture("en-GB");
            var style = DateTimeStyles.None;

            if (DateTime.TryParse(asset.PublicationDate, culture, style, out val))
            {
                return true;
            }
            else
            {
                Console.WriteLine("Cannot parse date {0}", asset.PublicationDate);
                return false;
            }
        }

        private static bool ValidateTitle(Asset asset)
        {
            if (String.IsNullOrWhiteSpace(asset.Title))
            {
                Console.WriteLine("Asset must have a title");
                return false;
            }
            else
            {
                return true;
            } 
        }

        static bool ValidateId(Asset asset)
        {
            if (String.IsNullOrWhiteSpace(asset.Id))
            {
                Console.WriteLine("Asset must have an id");
                return false;
            }
            else
            {
                return true;
            } 
        }
    }
}