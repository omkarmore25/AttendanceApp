/**
 * Haversine Formula — Calculate distance between two GPS coordinates
 * 
 * Returns the distance in METERS between two points on Earth
 * given their latitude and longitude in decimal degrees.
 * 
 * This is the core algorithm for the geofenced attendance system.
 * 
 * @param {number} lat1 - Latitude of point 1 (user's location)
 * @param {number} lon1 - Longitude of point 1 (user's location)
 * @param {number} lat2 - Latitude of point 2 (event location)
 * @param {number} lon2 - Longitude of point 2 (event location)
 * @returns {number} Distance in meters
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const EARTH_RADIUS_METERS = 6_371_000; // Earth's mean radius in meters

  // Convert degrees to radians
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

module.exports = haversineDistance;
