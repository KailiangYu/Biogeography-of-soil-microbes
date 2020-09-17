/**
 * This function takes in a feature collection of predicted and observed
 * values from a cross validation function and computes a final coefficient
 * of determination (mean and standard deviation value).
 * N.B., this function presumes that the property of interest is a
 * continuous value (rather than categorical); hence, an R^2 can actually
 * be calculated.
 * 
 * @param {ee.FeatureCollection} inputtedFC - The feature collection (FC) of 
 * samples returned by a cross validation function; every feature should
 * have a property of interest (the "observed" value), a "predicted" value (from
 * a model being assessed), and a cross validation fold assignent;
 * 
 * @param {string} mainPropName - The name of the property that is the
 * "observed" value in each feature;
 * 
 * @param {string} predictedPropName - The name of the property that holds
 * the "predicted" value of the property of interest (computed by the model
 * that is being assessed);
 * 
 * @param {strin} foldPropertyName - The name of the property that holds
 * the fold assignment of each feature;
 */

exports.computeR2FromCVFC = function(inputtedFC, mainPropName, predictedPropName, foldPropertyName) {

	// Compute a histogram of the fold numbers to determine how many folds there are
	var foldNumbers = ee.Dictionary(inputtedFC.aggregate_histogram(foldPropertyName)).keys();

	// Make a function to compute the R^2 of the collection
	var computeCoeffOfDetermination = function(inputtedFC, mainPropName, predictedPropName) {

		// Compute the average value of the main property of interest
		var mainValueMean = ee.Number(ee.Dictionary(inputtedFC.reduceColumns('mean', [mainPropName])).get('mean'));

		// Compute the total sum of squares
		var totalSumOfSquaresFC = inputtedFC.map(function(f) {
			return f.set('DependVarMeanDiffs', ee.Number(f.get(mainPropName)).subtract(mainValueMean).pow(2));
		});
		var totalSumOfSquares = ee.Number(totalSumOfSquaresFC.reduceColumns('sum', ['DependVarMeanDiffs']).get('sum'));

		// Compute the residual sum of squares
		var residualSumOfSquaresFC = inputtedFC.map(function(f) {
			return f.set('Residuals', ee.Number(f.get(mainPropName)).subtract(ee.Number(f.get(predictedPropName))).pow(2));
		});
		var residualSumOfSquares = ee.Number(residualSumOfSquaresFC.reduceColumns('sum', ['Residuals']).get('sum'));

		// Finalize the calculation
		var finalR2 = ee.Number(1).subtract(residualSumOfSquares.divide(totalSumOfSquares));

		return finalR2;
	};

	// Map through the fold numbers to compute R2 values at each fold
	var r2PerFold = foldNumbers.map(function(fN) {
		// Filter the collection by each of the fold numbers
		var filteredCollection = inputtedFC.filterMetadata(foldPropertyName, 'equals', ee.Number.parse(fN));

		// Compute the R2 for each fold / collection
		var r2Value = computeCoeffOfDetermination(filteredCollection, mainPropName, predictedPropName);

		return r2Value;
	});

	// Compute the final mean R2 value and its standard deviation
	var finalR2Value = r2PerFold.reduce(ee.Reducer.mean().combine(ee.Reducer.stdDev(), '', true));

	return finalR2Value;
};
