import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import api from '../api/client';
import theme from '../theme';
import { showAlert } from '../utils/dialog';

const CreateEventScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('07:00 PM');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState('50');
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Map Picker Modal state
  const [showMapModal, setShowMapModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingMap, setSearchingMap] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: '19.0760', lng: '72.8777' });

  const openMapPickerModal = () => {
    setMapCenter({ lat: latitude || '19.0760', lng: longitude || '72.8777' });
    setShowMapModal(true);
  };

  // Listen for Leaflet map click/drag postMessage events on Web
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      const handleMessage = (event) => {
        if (event.data?.type === 'PICK_LOCATION') {
          setLatitude(event.data.lat);
          setLongitude(event.data.lng);
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, []);

  // Live autocomplete search effect (triggers as user types)
  React.useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchingMap(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.trim())}`
        );
        const data = await res.json();
        if (data && data.length > 0) {
          setSearchResults(data.slice(0, 10));
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error('Live search error:', err);
      } finally {
        setSearchingMap(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchLocation = async (queryToSearch) => {
    const q = queryToSearch || searchQuery;
    if (!q.trim()) return;

    try {
      setSearchingMap(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q.trim())}`,
        {
          headers: {
            'User-Agent': 'SantSamagamApp/1.0 (omkarmore5178@gmail.com)',
            'Accept-Language': 'en',
          },
        }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        setSearchResults(data.slice(0, 10));
        const top = data[0];
        const lat = parseFloat(top.lat).toFixed(6);
        const lon = parseFloat(top.lon).toFixed(6);
        setLatitude(lat);
        setLongitude(lon);
        setMapCenter({ lat, lng: lon });
      } else {
        setSearchResults([]);
        showAlert('Not Found', 'Could not find coordinates for this location. Try searching another landmark or city.');
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchingMap(false);
    }
  };

  const selectSearchResult = (item) => {
    const lat = parseFloat(item.lat).toFixed(6);
    const lon = parseFloat(item.lon).toFixed(6);
    setLatitude(lat);
    setLongitude(lon);
    setMapCenter({ lat, lng: lon });
    setSearchResults([]);
  };

  // Use device's current location as event location
  const useCurrentLocation = async () => {
    try {
      setGettingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Denied', 'Location permission is required.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatitude(location.coords.latitude.toFixed(6));
      setLongitude(location.coords.longitude.toFixed(6));

      showAlert('📍 Location Set!', `Lat: ${location.coords.latitude.toFixed(6)}\nLng: ${location.coords.longitude.toFixed(6)}`);
    } catch (error) {
      showAlert('Error', 'Failed to get current location.');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleCreate = async () => {
    if (loading) return; // Prevent double submit

    // Validation
    if (!name.trim()) {
      showAlert('Missing Field', 'Please enter an event name.');
      return;
    }
    // Date Validation (DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD)
    let formattedDate = date.trim().replace(/\//g, '-');
    if (/^\d{2}-\d{2}-\d{4}$/.test(formattedDate)) {
      const [d, m, y] = formattedDate.split('-');
      formattedDate = `${y}-${m}-${d}`;
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
      showAlert('Invalid Date', 'Please enter date in DD/MM/YYYY format.\nExample: 15/08/2026');
      return;
    }

    // Time Validation (12-hour e.g. 2:30 PM or 24-hour e.g. 14:30)
    let formattedTime = time.trim();
    if (!/^(0?[1-9]|1[0-2]):[0-5]\d\s*(AM|PM|am|pm)$/i.test(formattedTime) && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(formattedTime)) {
      showAlert('Invalid Time', 'Please enter time in 12-hour format.\nExample: 02:30 PM or 10:00 AM');
      return;
    }

    if (latitude == null || longitude == null || latitude === '' || longitude === '') {
      showAlert('Missing Location', 'Please set the event location.');
      return;
    }

    try {
      setLoading(true);

      await api.post('/events', {
        name: name.trim(),
        scheduled_date: formattedDate,
        start_time: formattedTime,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius_in_meters: parseInt(radius) || 50,
      });

      showAlert('✅ Event Created!', `"${name}" has been scheduled.`, () => {
        navigation.goBack();
      });
    } catch (error) {
      showAlert('Error', error.response?.data?.message || 'Failed to create event.');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label, value, setter, fieldKey, options = {}) => (
    <View style={[styles.inputGroup, focusedField === fieldKey && styles.inputGroupFocused]}>
      <Text style={styles.inputLabel}>{label}</Text>
      {Platform.OS === 'web' && options.type === 'date' ? (
        <input
          type="date"
          value={value && value.includes('/') ? value.split('/').reverse().join('-') : (value && value.includes('-') && value.split('-')[0].length === 2 ? value.split('-').reverse().join('-') : value)}
          onChange={(e) => {
            const val = e.target.value;
            if (val) {
              const [y, m, d] = val.split('-');
              setter(`${d}/${m}/${y}`);
            }
          }}
          style={{
            backgroundColor: 'transparent',
            color: '#ffffff',
            colorScheme: 'dark',
            border: 'none',
            outline: 'none',
            fontSize: '15px',
            paddingTop: '6px',
            paddingBottom: '6px',
            width: '100%',
            fontFamily: 'inherit',
          }}
        />
      ) : Platform.OS === 'web' && options.type === 'time' ? (
        <input
          type="time"
          value={(() => {
            if (!value) return '';
            if (/^\d{2}:\d{2}$/.test(value)) return value;
            const match = value.match(/^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM|am|pm)$/i);
            if (match) {
              let h = parseInt(match[1], 10);
              const m = match[2];
              const p = match[3].toUpperCase();
              if (p === 'PM' && h < 12) h += 12;
              if (p === 'AM' && h === 12) h = 0;
              return `${String(h).padStart(2, '0')}:${m}`;
            }
            return '';
          })()}
          onChange={(e) => {
            const val = e.target.value;
            if (val) {
              const [h, m] = val.split(':');
              const hourInt = parseInt(h, 10);
              const period = hourInt >= 12 ? 'PM' : 'AM';
              const displayHour = hourInt % 12 || 12;
              const formattedH = String(displayHour).padStart(2, '0');
              setter(`${formattedH}:${m} ${period}`);
            }
          }}
          style={{
            backgroundColor: 'transparent',
            color: '#ffffff',
            colorScheme: 'dark',
            border: 'none',
            outline: 'none',
            fontSize: '15px',
            paddingTop: '6px',
            paddingBottom: '6px',
            width: '100%',
            fontFamily: 'inherit',
          }}
        />
      ) : (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setter}
          placeholderTextColor={theme.colors.textMuted}
          onFocus={() => setFocusedField(fieldKey)}
          onBlur={() => setFocusedField(null)}
          {...options}
        />
      )}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Create Event</Text>
      <Text style={styles.subtitle}>Schedule a new Satsang / Samagam event</Text>

      {renderInput('EVENT NAME / PLACE', name, setName, 'name', {
        placeholder: 'e.g., Sant Samagam Place',
      })}

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={[styles.inputGroup, focusedField === 'date' && styles.inputGroupFocused]}>
            <Text style={styles.inputLabel}>DATE (DD/MM/YYYY)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={date}
                onChangeText={setDate}
                placeholder="15/08/2026"
                placeholderTextColor={theme.colors.textMuted}
                onFocus={() => setFocusedField('date')}
                onBlur={() => setFocusedField(null)}
              />
              {Platform.OS === 'web' && (
                <input
                  type="date"
                  onChange={(e) => {
                    if (e.target.value) {
                      const [y, m, d] = e.target.value.split('-');
                      setDate(`${d}/${m}/${y}`);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    right: 0,
                    opacity: 0,
                    width: '36px',
                    height: '36px',
                    cursor: 'pointer',
                  }}
                />
              )}
              <Text style={{ fontSize: 18, marginLeft: 4 }}>📅</Text>
            </View>
          </View>
        </View>

        <View style={{ flex: 1, marginLeft: 8 }}>
          <View style={[styles.inputGroup, focusedField === 'time' && styles.inputGroupFocused]}>
            <Text style={styles.inputLabel}>TIME (e.g. 02:30 PM)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={time}
                onChangeText={setTime}
                placeholder="02:30 PM"
                placeholderTextColor={theme.colors.textMuted}
                onFocus={() => setFocusedField('time')}
                onBlur={() => setFocusedField(null)}
              />
              {Platform.OS === 'web' && (
                <input
                  type="time"
                  onChange={(e) => {
                    if (e.target.value) {
                      const [h, m] = e.target.value.split(':');
                      const hourInt = parseInt(h, 10);
                      const period = hourInt >= 12 ? 'PM' : 'AM';
                      const displayHour = hourInt % 12 || 12;
                      const formattedH = String(displayHour).padStart(2, '0');
                      setTime(`${formattedH}:${m} ${period}`);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    right: 0,
                    opacity: 0,
                    width: '36px',
                    height: '36px',
                    cursor: 'pointer',
                  }}
                />
              )}
              <Text style={{ fontSize: 18, marginLeft: 4 }}>⏰</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Location Section */}
      <View style={styles.locationSection}>
        <Text style={styles.locationTitle}>📍 Event Location</Text>

        <View style={styles.locationBtnGroup}>
          <TouchableOpacity
            style={[styles.locationBtn, { flex: 1, marginRight: 6 }]}
            onPress={useCurrentLocation}
            disabled={gettingLocation}
            activeOpacity={0.8}
          >
            {gettingLocation ? (
              <ActivityIndicator color={theme.colors.primary} size="small" />
            ) : (
              <Text style={styles.locationBtnText}>📡 GPS Current</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.locationBtn, { flex: 1, marginLeft: 6, backgroundColor: theme.colors.accent + '20', borderColor: theme.colors.accent + '50' }]}
            onPress={openMapPickerModal}
            activeOpacity={0.8}
          >
            <Text style={[styles.locationBtnText, { color: theme.colors.accent }]}>🗺️ Select on Map</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.orText}>— or enter coordinates manually —</Text>

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            {renderInput('LATITUDE', latitude, setLatitude, 'lat', {
              placeholder: '19.0760',
              keyboardType: 'decimal-pad',
            })}
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            {renderInput('LONGITUDE', longitude, setLongitude, 'lng', {
              placeholder: '72.8777',
              keyboardType: 'decimal-pad',
            })}
          </View>
        </View>
      </View>

      {renderInput('GEOFENCE RADIUS (meters)', radius, setRadius, 'radius', {
        placeholder: '50',
        keyboardType: 'number-pad',
      })}

      {/* Create Button */}
      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.submitText}>Create Event</Text>
        )}
      </TouchableOpacity>

      {/* Interactive Map Picker Modal */}
      <Modal
        visible={showMapModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMapModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>🗺️ Interactive Map Search</Text>
                <Text style={styles.modalSubtitle}>Search any temple, landmark or city</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowMapModal(false)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input inside Map Modal */}
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search city, temple, or hall name..."
                placeholderTextColor={theme.colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => searchLocation()}
              />
              <TouchableOpacity
                style={styles.searchBtn}
                onPress={() => searchLocation()}
                disabled={searchingMap}
              >
                {searchingMap ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.searchBtnText}>🔍 Search</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Search Results Dropdown List (Scrollable) */}
            {searchResults.length > 0 && (
              <ScrollView
                style={styles.searchResultsBox}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                {searchResults.map((item, idx) => (
                  <TouchableOpacity
                    key={item.place_id || idx}
                    style={styles.searchResultRow}
                    onPress={() => selectSearchResult(item)}
                  >
                    <Text style={styles.searchResultText} numberOfLines={1}>
                      📍 {item.display_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Embedded Interactive Google Map (Click or Drag to Pin Anywhere) */}
            <View style={styles.mapContainer}>
              {Platform.OS === 'web' ? (
                <iframe
                  title="Interactive Location Map"
                  width="100%"
                  height="270"
                  style={{ border: 0, borderRadius: 12 }}
                  srcDoc={`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #0b0f19; }
    .leaflet-container { font-family: sans-serif; }
    .leaflet-control-attribution { display: none !important; }
    .google-badge {
      position: absolute; bottom: 8px; left: 8px; z-index: 1000;
      background: rgba(28, 36, 56, 0.9); color: #ff6b00; border: 1px solid #ff6b00;
      padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; pointer-events: none;
    }
    .view-toggle {
      position: absolute; top: 10px; right: 10px; z-index: 1000;
      background: #1c2438; color: #ff6b00; border: 1px solid #ff6b00;
      padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="google-badge">Google Maps</div>
  <button class="view-toggle" id="toggleBtn" onclick="toggleMapType()">🛰️ Satellite View</button>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([${mapCenter.lat}, ${mapCenter.lng}], 15);
    
    var googleRoadmap = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: '© Google Maps'
    }).addTo(map);

    var googleSatellite = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: '© Google Maps'
    });

    var isSatellite = false;
    function toggleMapType() {
      if (isSatellite) {
        map.removeLayer(googleSatellite);
        googleRoadmap.addTo(map);
        document.getElementById('toggleBtn').innerText = '🛰️ Satellite View';
      } else {
        map.removeLayer(googleRoadmap);
        googleSatellite.addTo(map);
        document.getElementById('toggleBtn').innerText = '🗺️ Roadmap View';
      }
      isSatellite = !isSatellite;
    }

    var customIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    var marker = L.marker([${mapCenter.lat}, ${mapCenter.lng}], { icon: customIcon, draggable: true }).addTo(map);

    function notifyParent(lat, lng) {
      var msg = JSON.stringify({ type: 'PICK_LOCATION', lat: lat.toFixed(6), lng: lng.toFixed(6) });
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(msg);
      }
      if (window.parent) {
        window.parent.postMessage({ type: 'PICK_LOCATION', lat: lat.toFixed(6), lng: lng.toFixed(6) }, '*');
      }
    }

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      notifyParent(e.latlng.lat, e.latlng.lng);
    });

    marker.on('dragend', function(e) {
      var pt = marker.getLatLng();
      notifyParent(pt.lat, pt.lng);
    });
  </script>
</body>
</html>`}
                />
              ) : (
                <WebView
                  originWhitelist={['*']}
                  source={{
                    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #0b0f19; }
    .leaflet-container { font-family: sans-serif; }
    .leaflet-control-attribution { display: none !important; }
    .google-badge {
      position: absolute; bottom: 8px; left: 8px; z-index: 1000;
      background: rgba(28, 36, 56, 0.9); color: #ff6b00; border: 1px solid #ff6b00;
      padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; pointer-events: none;
    }
    .view-toggle {
      position: absolute; top: 10px; right: 10px; z-index: 1000;
      background: #1c2438; color: #ff6b00; border: 1px solid #ff6b00;
      padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="google-badge">Google Maps</div>
  <button class="view-toggle" id="toggleBtn" onclick="toggleMapType()">🛰️ Satellite View</button>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([${mapCenter.lat}, ${mapCenter.lng}], 15);

    var googleRoadmap = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: '© Google Maps'
    }).addTo(map);

    var googleSatellite = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: '© Google Maps'
    });

    var isSatellite = false;
    function toggleMapType() {
      if (isSatellite) {
        map.removeLayer(googleSatellite);
        googleRoadmap.addTo(map);
        document.getElementById('toggleBtn').innerText = '🛰️ Satellite View';
      } else {
        map.removeLayer(googleRoadmap);
        googleSatellite.addTo(map);
        document.getElementById('toggleBtn').innerText = '🗺️ Roadmap View';
      }
      isSatellite = !isSatellite;
    }

    var customIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    var marker = L.marker([${mapCenter.lat}, ${mapCenter.lng}], { icon: customIcon, draggable: true }).addTo(map);

    function notifyParent(lat, lng) {
      var msg = JSON.stringify({ type: 'PICK_LOCATION', lat: lat.toFixed(6), lng: lng.toFixed(6) });
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(msg);
      }
    }

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      notifyParent(e.latlng.lat, e.latlng.lng);
    });

    marker.on('dragend', function(e) {
      var pt = marker.getLatLng();
      notifyParent(pt.lat, pt.lng);
    });
  </script>
</body>
</html>`
                  }}
                  onMessage={(event) => {
                    try {
                      const data = JSON.parse(event.nativeEvent.data);
                      if (data.type === 'PICK_LOCATION') {
                        setLatitude(String(data.lat));
                        setLongitude(String(data.lng));
                      }
                    } catch (e) {}
                  }}
                  style={{ width: '100%', height: 270, borderRadius: 12 }}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                />
              )}
            </View>

            <View style={styles.coordsDisplayBox}>
              <Text style={styles.coordsLabel}>Selected Coordinates:</Text>
              <Text style={styles.coordsValText}>
                Latitude: {latitude || 'Not Set'}  ·  Longitude: {longitude || 'Not Set'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.confirmMapBtn}
              onPress={() => {
                if (!latitude || !longitude) {
                  showAlert('No Location Selected', 'Please search or enter coordinates first.');
                  return;
                }
                setShowMapModal(false);
                showAlert('✅ Location Selected', `Lat: ${latitude}\nLng: ${longitude}`);
              }}
            >
              <Text style={styles.confirmMapBtnText}>Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    padding: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: 100,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.heavy,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  row: {
    flexDirection: 'row',
  },
  inputGroup: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  inputGroupFocused: {
    borderColor: theme.colors.primary,
  },
  inputLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  input: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing.xs,
  },
  locationSection: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  locationTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  locationBtn: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
  },
  locationBtnText: {
    color: theme.colors.primaryLight,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  orText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    marginVertical: theme.spacing.md,
  },
  locationBtnGroup: {
    flexDirection: 'row',
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadow.md,
  },
  submitText: {
    color: '#fff',
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.bgOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.heavy,
    color: theme.colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchRow: {
    flexDirection: 'row',
    marginVertical: theme.spacing.md,
    gap: 8,
  },
  searchResultsBox: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary + '50',
    maxHeight: 140,
    overflow: 'hidden',
  },
  searchResultRow: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchResultText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: theme.colors.bgInput,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
  },
  searchBtnText: {
    color: '#ffffff',
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.sm,
  },
  mapContainer: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    backgroundColor: '#111624',
  },
  nativeMapFallback: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  nativeMapText: {
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.bold,
    marginBottom: 4,
  },
  coordsText: {
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.bold,
  },
  coordsDisplayBox: {
    backgroundColor: theme.colors.bgInput,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  coordsLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: 2,
  },
  coordsValText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.bold,
  },
  confirmMapBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmMapBtnText: {
    color: '#ffffff',
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.md,
  },
  quickPresetRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  quickPresetBtn: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary + '40',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quickPresetText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default CreateEventScreen;
