// This function accomplishes two distinct goals:
// - it fills any gaps in an image (<10km) with the nearest pixel value
// - it extends the borders of an im (by 10km) with the nearest pixel value
// N.B., This script is based on code from Matt Hancher and includes annotations
// from his original code.
exports.gapFillAndExtendBounds = function(multiBandImage,bandList,distanceToFillInMeters){

// Use a helper function to fill holes and boundaries with the nearest value
var fillHolesWithNearestValue = function(imageToFill) {

	var source = imageToFill.mask();

	// Measure 1000000x the distance to the nearest valid pixel. We pick
	// a large cost (here 1000000) so that the least-cost path will not be
	// influenced later by the border pixels.
	var cost0 = ee.Image(1000000).where(source, 0).cumulativeCost(source, distanceToFillInMeters);

	// Measure the distance to the nearest pixel plus the half-pixel
	// traversal to the center of a valid border pixel, which may be
	// 1/2 or 1/sqrt(2).
	var cost1 = ee.Image(1000000).where(source, 1).cumulativeCost(source, distanceToFillInMeters);

	// Measure the distance to the nearest pixel plus the half-pixel
	// traversal to center of a valid pixel, where the valid pixel
	// has a cost equal to its original value.
	var cost2 = imageToFill.unmask(1000000).cumulativeCost(source, distanceToFillInMeters);

	// Finally we can compute the original value of the nearest
	// unmasked pixel.
	var fill = cost2.subtract(cost0).divide(cost1.subtract(cost0));

	// Fill in the masked pixels.
	var filled = imageToFill.unmask(0).add(fill);

	return filled.copyProperties(imageToFill);
};

// Use a helper function to convert an image collection to a multiband image
var icToImage = function(imageCollection) {

	// Create an empty image to fill
	var emptyImage = ee.Image([]);

	// Iterate through the collection to make the new multiband image
	var multibandImage = ee.Image(imageCollection.iterate(function(image, result) {
		return ee.Image(result).addBands(image);
	}, emptyImage));

	return multibandImage;
};

// Turn the multiband image of interest into an image collection
var imageCollection = ee.ImageCollection(multiBandImage.bandNames().map(function(bandName) { 
  return multiBandImage.select([bandName]).set({ImageName:bandName});
}));
// print('Image Collection from Composite',imageCollection);

// Separate out the images that shouldn't be filled
var imagesNotToFill = imageCollection.filter(ee.Filter.inList('ImageName',bandList).not());
// print('Images not to Fill',imagesNotToFill);

var imagesNotFilled = icToImage(imagesNotToFill);
// print('Images not Filled',imagesNotFilled);

var imagesToFill = imageCollection.filter(ee.Filter.inList('ImageName',bandList));
// print('Images to Fill',imagesToFill);

var imagesFilled = imagesToFill.map(fillHolesWithNearestValue);
// print('Gap Filled Images',imagesFilled);

var multiBandImageFilled = icToImage(imagesFilled);
// print('Multiband image filled',multiBandImageFilled);

var stackedCompositeFilled = ee.Image.cat(multiBandImageFilled,imagesNotFilled);
// print('Filled Composite',stackedCompositeFilled);

return stackedCompositeFilled;

};
