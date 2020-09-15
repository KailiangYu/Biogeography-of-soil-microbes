# Biogeography-of-soil-microbes

This repository contains the machine learning code used for the analyses in the project ‘The biogeography of soil fungal and bacterial biomass’

There are five steps described below. 

Step 1: Load raw data of fungal proportion and total soil microbial biomass C. Convert points with values of interests and coordinates (latitude and longitude) 
to point shapefiles. 

Step 2: Load point shapefiles into google earth engine and then aggregate soil sample values at 30 arc-seconds resolution as average. 

Step 3: Extract environmental covariates (n = 90; see supplementary Table 1) on all the soil samples at 30 arc-seconds resolution based on the coordinates of 
soil samples. 

Step 4: Conduct random forest machine learning algorithms with 10-fold cross validation to select the best model used for extrapolation. 

Step 5: Use the final best models to extrapolate and generate final maps of fungal proportion and total soil microbial biomass C. 

Note: Code of other tools and datasets are available upon request.  


