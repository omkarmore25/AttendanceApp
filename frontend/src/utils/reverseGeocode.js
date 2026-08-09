/**
 * Reverse Geocode — Convert GPS coordinates to a readable address
 * Uses the free OpenStreetMap Nominatim API (no API key needed)
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'AttendanceApp/1.0',
        },
      }
    );

    const data = await response.json();

    if (data && data.display_name) {
      // Return a shortened address (first 2-3 parts)
      const parts = data.display_name.split(', ');
      const shortAddress = parts.slice(0, 3).join(', ');
      return {
        full: data.display_name,
        short: shortAddress,
        road: data.address?.road || '',
        city: data.address?.city || data.address?.town || data.address?.village || '',
        state: data.address?.state || '',
      };
    }

    return { full: 'Unknown location', short: 'Unknown' };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return { full: 'Location unavailable', short: 'Unavailable' };
  }
};
