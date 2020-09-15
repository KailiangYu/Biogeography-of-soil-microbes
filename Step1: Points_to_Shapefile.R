library(maptools)
library(maps)
library(rgdal)


setwd("/Volumes/LaCie/Soil fugal and baterial biomass/Writing/Revision/Data_submission")

fung_data<-read.csv('fung_pro_data_all_rev6.csv')

# map and see data distribution
map("world", fill=TRUE, col="white", bg="lightblue", ylim=c(-60, 90), mar=c(0,0,0,0))
points(fung_data$Lon,fung_data$Lat, col="red", pch=6) 

plot.fung_data <- SpatialPointsDataFrame(fung_data[,3:2],
                                         fung_data,    #the R object to convert
                                         proj4string = CRS("+proj=longlat +datum=WGS84 +ellps=WGS84 +towgs84=0,0,0"))   # assign a CRS 

plot(plot.fung_data, 
     main="Map of Plot Locations")

setwd("/Volumes/LaCie/Soil fugal and baterial biomass/Writing/Revision/Data_submission")

writeOGR(plot.fung_data,
         "Fun_pro_new_all_rev6", "Fun_pro_new_all_rev6", layer="Fun_pro_new_all_rev6", driver = "ESRI Shapefile")




