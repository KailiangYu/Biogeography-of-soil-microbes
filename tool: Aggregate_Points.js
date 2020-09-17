/**
 * This function takes a point collection with a property of interest and
 * aggregates all points falling within unique sampled pixel coordinates.
 * 
 * @param {ee.FeatureCollection} sampledPoints - The feature collection (FC) of 
 * containing a property of interest to aggregated and the sampled coordinates
 * of the pixels from the image/grid being used to aggregated the points;
 * 
 * @param {string} propertyNameToAggregate - The name of the property that is the
 * you would like to aggregated
 * 
 * @param {string} [inputtedReducer = 'mean'] - The name of the reducer used to aggregated
 * the property of interest; input this as a string. E.g., 'mean' is the default;
 * 
 * @param {string} [latAsString = 'latitude'] - The name of the property in each point holding
 * the latitude of the sampled pixel grid/image;
 * 
 * @param {string} [longAsString = 'longitude'] - The name of the property in each point holding
 * the longitude of the sampled pixel grid/image;
 * 
 * 
 */
 
exports.aggregatePointsIntoPixels = function(sampledPoints,propertyNameToAggregate,inputtedReducer,latAsString,longAsString) {
  
  // Set default names for the lat/long bands and properties, if not specified
  var latitudeString = latAsString||'latitude';
  var longitudeString = longAsString||'longitude';

	// Concatenate the lat/longs to make unique string properties for filtering
	var latLongsAsStrings = sampledPoints.map(function(f) {
		return f.set('UniqueLatLongString', ee.String(f.get(latitudeString)).cat(ee.String(f.get(longitudeString))));
	});

	// Return a list of all unique lat/long strings
	var uniqueStrings = ee.Dictionary(latLongsAsStrings.aggregate_histogram('UniqueLatLongString')).keys();

	// Make the list of unique strings into a feature collection
	var stringFC = ee.FeatureCollection(uniqueStrings.map(function(s) {
		return ee.Feature(null).set('UniqueLatLongString', s);
	}));

	// Make a filter to perform a join, gathering all pixels with the same unique lat/long
	var stringFilter = ee.Filter.equals({
		leftField: 'UniqueLatLongString',
		rightField: 'UniqueLatLongString'
	});
	var collectedPoints = ee.Join.saveAll('PointsToMerge').apply(stringFC, latLongsAsStrings, stringFilter);

	// Map through all features and merge the points in them using a specified reducer
	var reducerToUseAsString = inputtedReducer||'mean';
	var propertyToReduce = propertyNameToAggregate;
	var finalPoints = collectedPoints.map(function(f) {
		// Get all matching points as a feature collection
		var matchingPoints = ee.FeatureCollection(ee.List(f.get('PointsToMerge')));
		var firstMatchingPoint = ee.Feature(ee.List(f.get('PointsToMerge')).get(0));

		// Reduce every point to a single feature
		var reducedFCsDict = matchingPoints.reduceColumns({
				reducer: reducerToUseAsString,
				selectors: [propertyToReduce]
			})
			.rename([reducerToUseAsString], [propertyToReduce]);
		var featureToReturn = ee.Feature(ee.Geometry.Point(ee.Number(firstMatchingPoint.get(longitudeString)),
				ee.Number(firstMatchingPoint.get(latitudeString))))
			.set(reducedFCsDict);

		return featureToReturn;
	});

	return finalPoints;

};
