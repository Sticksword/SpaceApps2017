from pyproj import Proj, transform

inProj = Proj(init='epsg:3857')
outProj = Proj(init='epsg:4326')
x1,y1 = -11705274.6374,4826473.6922
x2,y2 = transform(inProj,outProj,x1,y1)
print x2,y2


wgs84 = Proj(init='EPSG:4326')
lat = 50
lon = 50
x, y = wgs84(lon, lat)

print x, y
