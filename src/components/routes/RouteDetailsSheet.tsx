import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CollectionRoute } from '../../types/route';
import { Producer } from '../../types/producer'; 
import { CooperativeInfo } from '../../types/cooperative'; 
import { RouteCalculator } from '../../services/routing/RouteCalculator';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 20,
    borderBottom: 1,
    paddingBottom: 10,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cooperativeInfo: {
    flex: 1,
  },
  cooperativeName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 5,
  },
  cooperativeLocation: {
    fontSize: 10,
    color: '#666',
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 5,
    backgroundColor: '#f3f4f6',
    padding: 5,
  },
  routeInfo: {
    marginBottom: 15,
  },
  routeInfoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  routeInfoLabel: {
    width: '40%',
    fontWeight: '700',
  },
  routeInfoValue: {
    width: '60%',
  },
  map: {
    width: '100%',
    height: 300,
    marginVertical: 10,
    border: 1,
    borderColor: '#E5E7EB',
  },
  routeTable: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#f3f4f6',
    padding: 5,
    fontWeight: '700',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    padding: 5,
  },
  stopCell: {
    width: '10%',
  },
  locationCell: {
    width: '40%',
  },
  distanceCell: {
    width: '25%',
  },
  timeCell: {
    width: '25%',
  },
  fuelSection: {
    marginTop: 15,
  },
  fuelRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  fuelLabel: {
    width: '60%',
    fontWeight: '700',
  },
  fuelValue: {
    width: '40%',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: 'grey',
    fontSize: 10,
  },
});

interface RouteDetailsSheetProps {
  route: CollectionRoute;
  producers: Producer[];
  cooperative: CooperativeInfo;
  mapImageUrl?: string;
}

export default function RouteDetailsSheet({
  route,
  producers = [],
  cooperative = { name: 'SMARTCOOP', location: 'Abidjan', coordinates: [5.9309666, -4.2143906], certifications: [] },
  mapImageUrl
}: RouteDetailsSheetProps) {
  // Get today's date for the footer
  const today = format(new Date(), 'dd MMMM yyyy', { locale: fr });

  // Déterminer les points de départ et d'arrivée
  const startLocation = route.useCooperativeAsStart !== false ? 
    cooperative.location : route.startLocation || cooperative.location;
  
  const endLocation = route.useCooperativeAsEnd !== false ? 
    cooperative.location : route.endLocation || cooperative.location;

  // Get producers for this route
  const routeProducers = producers.filter(p => 
    route.stops && route.stops.some(stop => stop.producerId === p.id)
  );

  // Calculate route metrics
  const points = [
    cooperative.coordinates,
    ...routeProducers.map(p => p.coordinates)
  ];
  
  // Calculate total distance
  const totalDistance = RouteCalculator.calculateRouteDistance(route, producers, cooperative);
  
  // Calculate segment distances
  const segmentDistances: number[] = [];
  let currentPoint = route.useCooperativeAsStart !== false ? 
    cooperative.coordinates : 
    routeProducers[0]?.coordinates || cooperative.coordinates;
  
  for (let i = 0; i < routeProducers.length; i++) {
    const nextPoint = routeProducers[i].coordinates;
    segmentDistances.push(RouteCalculator.calculateDistance(currentPoint, nextPoint));
    currentPoint = nextPoint;
  }
  
  // Add final segment back to end location
  const finalPoint = route.useCooperativeAsEnd !== false ? 
    cooperative.coordinates : 
    routeProducers[routeProducers.length - 1]?.coordinates || cooperative.coordinates;
  
  segmentDistances.push(RouteCalculator.calculateDistance(currentPoint, finalPoint));
  
  // Calculate duration
  const duration = RouteCalculator.estimateDuration(totalDistance);
  
  // Calculate fuel consumption (8L/100km is an average consumption)
  const fuelConsumption = RouteCalculator.calculateFuelConsumption(totalDistance);

  // Create stops list with distances
  const stops = [
    { name: startLocation === cooperative.location ? cooperative.name : "Point de départ", location: startLocation },
    ...routeProducers.map(p => ({ 
      name: p.fullName, 
      location: p.address
    })),
    { name: endLocation === cooperative.location ? cooperative.name : "Point d'arrivée", location: endLocation }
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.cooperativeInfo}>
              <Text style={styles.cooperativeName}>{cooperative?.name || 'SMARTCOOP'}</Text>
              <Text style={styles.cooperativeLocation}>{cooperative?.location || 'Abidjan'}</Text>
            </View>
          </View>
          <Text style={styles.title}>ITINÉRAIRE OPTIMISÉ</Text>
        </View>

        {/* Route Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations de la tournée</Text>
          
          <View style={styles.routeInfo}>
            <View style={styles.routeInfoRow}>
              <Text style={styles.routeInfoLabel}>Nom de la tournée:</Text>
              <Text style={styles.routeInfoValue}>{route.name}</Text>
            </View>
            <View style={styles.routeInfoRow}>
              <Text style={styles.routeInfoLabel}>Date:</Text>
              <Text style={styles.routeInfoValue}>{format(route.date, 'dd MMMM yyyy', { locale: fr })}</Text>
            </View>
            <View style={styles.routeInfoRow}>
              <Text style={styles.routeInfoLabel}>Chauffeur:</Text>
              <Text style={styles.routeInfoValue}>{route.driver}</Text>
            </View>
            <View style={styles.routeInfoRow}>
              <Text style={styles.routeInfoLabel}>Distance totale:</Text>
              <Text style={styles.routeInfoValue}>{Math.round(totalDistance)} km</Text>
            </View>
            <View style={styles.routeInfoRow}>
              <Text style={styles.routeInfoLabel}>Durée estimée:</Text>
              <Text style={styles.routeInfoValue}>{Math.floor(duration / 60)}h{Math.round(duration % 60).toString().padStart(2, '0')}</Text>
            </View>
            <View style={styles.routeInfoRow}>
              <Text style={styles.routeInfoLabel}>Nombre d'arrêts:</Text>
              <Text style={styles.routeInfoValue}>{routeProducers.length}</Text>
            </View>
            <View style={styles.routeInfoRow}>
              <Text style={styles.routeInfoLabel}>Point de départ:</Text>
              <Text style={styles.routeInfoValue}>{startLocation}</Text>
            </View>
            <View style={styles.routeInfoRow}>
              <Text style={styles.routeInfoLabel}>Point d'arrivée:</Text>
              <Text style={styles.routeInfoValue}>{endLocation}</Text>
            </View>
          </View>
        </View>

        {/* Map */}
        {mapImageUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Carte de l'itinéraire</Text>
            <Image src={mapImageUrl} style={styles.map} />
          </View>
        )}

        {/* Detailed Route */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itinéraire détaillé</Text>
          
          <View style={styles.routeTable}>
            <View style={styles.tableHeader}>
              <Text style={styles.stopCell}>Étape</Text>
              <Text style={styles.locationCell}>Lieu</Text>
              <Text style={styles.distanceCell}>Distance</Text>
              <Text style={styles.timeCell}>Durée estimée</Text>
            </View>
            
            {stops.map((stop, index) => {
              // Skip the last stop in the loop (it's added separately)
              if (index === stops.length - 1) return null;
              
              const distance = segmentDistances[index];
              const segmentDuration = RouteCalculator.estimateDuration(distance);
              
              return (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.stopCell}>{index === 0 ? 'Départ' : `Arrêt ${index}`}</Text>
                  <Text style={styles.locationCell}>{stop.name}</Text>
                  <Text style={styles.distanceCell}>{Math.round(distance)} km</Text>
                  <Text style={styles.timeCell}>{Math.round(segmentDuration)} min</Text>
                </View>
              );
            })}
            
            {/* Add return to cooperative */}
            <View style={styles.tableRow}>
              <Text style={styles.stopCell}>Arrivée</Text>
              <Text style={styles.locationCell}>{stops[stops.length - 1].name}</Text>
              <Text style={styles.distanceCell}>
                {Math.round(segmentDistances[segmentDistances.length - 1])} km
              </Text>
              <Text style={styles.timeCell}>
                {Math.round(RouteCalculator.estimateDuration(segmentDistances[segmentDistances.length - 1]))} min
              </Text>
            </View>
          </View>
        </View>

        {/* Fuel Calculation */}
        <View style={styles.fuelSection}>
          <Text style={styles.sectionTitle}>Carburant</Text>
          
          <View style={styles.fuelRow}>
            <Text style={styles.fuelLabel}>Consommation estimée (8L/100km):</Text>
            <Text style={styles.fuelValue}>{fuelConsumption.toFixed(2)} litres</Text>
          </View>
          <View style={styles.fuelRow}>
            <Text style={styles.fuelLabel}>Réserve recommandée (+20%):</Text>
            <Text style={styles.fuelValue}>{(fuelConsumption * 1.2).toFixed(2)} litres</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Document généré le {today} - {cooperative?.name || 'SMARTCOOP'}
        </Text>
      </Page>
    </Document>
  );
}