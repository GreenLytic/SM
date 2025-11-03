export const MAPBOX_TOKEN = 'pk.eyJ1Ijoib3duMjAyNCIsImEiOiJjbTNxdmVtZmIwdHp0MmlvbnY1bzZ5cXAxIn0.2Q1r0mJUmEsu-iDS1H__-A';

export const mapStyles = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12'
};

export const defaultMapSettings = {
  style: mapStyles.streets,
  center: [5.9309666, -4.2143906] as [number, number],
  zoom: 12,
  minZoom: 2,
  maxZoom: 18
};

export const customMapStyle = {
  cooperative: {
    color: '#2F5E1E',
    size: 40
  },
  producer: {
    color: '#4CAF50',
    size: 30
  },
  route: {
    color: '#2F5E1E',
    width: 4,
    opacity: 0.7
  }
};