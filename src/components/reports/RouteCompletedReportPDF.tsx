import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { CollectionRoute } from '../../types/route';
import { Producer } from '../../types/producer';
import { CooperativeInfo } from '../../types/cooperative';
import { Collection } from '../../types/collection';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
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
    borderBottomColor: '#2F5E1E',
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
    color: '#2F5E1E',
  },
  cooperativeLocation: {
    fontSize: 10,
    color: '#666',
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
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
    borderLeftWidth: 4,
    borderLeftColor: '#2F5E1E',
    borderLeftStyle: 'solid',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
    paddingVertical: 3,
  },
  label: {
    width: '40%',
    fontWeight: '700',
    color: '#444',
  },
  value: {
    width: '60%',
    color: '#333',
  },
  table: {
    display: 'table',
    width: 'auto',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'solid',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
    minHeight: 25,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    fontWeight: '700',
  },
  tableCell: {
    flex: 1,
    padding: 5,
    textAlign: 'left',
  },
  tableCellNarrow: {
    width: '15%',
    padding: 5,
    textAlign: 'left',
  },
  tableCellWide: {
    width: '25%',
    padding: 5,
    textAlign: 'left',
  },
  tableCellCenter: {
    flex: 1,
    padding: 5,
    textAlign: 'center',
  },
  producerSection: {
    marginBottom: 15,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'solid',
    borderRadius: 4,
  },
  producerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
    paddingBottom: 5,
  },
  producerName: {
    fontWeight: '700',
    fontSize: 12,
  },
  producerStatus: {
    fontSize: 10,
    color: '#fff',
    backgroundColor: '#22c55e',
    padding: 3,
    borderRadius: 10,
  },
  producerStatusCancelled: {
    backgroundColor: '#ef4444',
  },
  producerStatusPending: {
    backgroundColor: '#f59e0b',
  },
  producerDetails: {
    marginTop: 5,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  detailLabel: {
    width: '40%',
    fontSize: 10,
    color: '#666',
  },
  detailValue: {
    width: '60%',
    fontSize: 10,
  },
  notesBox: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'solid',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 10,
    color: '#666',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 9,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
    paddingTop: 10,
  },
  pageBreak: {
    height: 1,
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: 'transparent',
    breakAfter: 'page',
  },
  signatureSection: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    height: 60,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'solid',
    padding: 5,
  },
  signatureLabel: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 5,
  },
  logisticsTable: {
    marginTop: 10,
  },
  expensesSection: {
    marginTop: 15,
  },
  expenseRow: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'center',
  },
  expenseLabel: {
    width: '40%',
    fontSize: 11,
  },
  expenseValue: {
    width: '60%',
    fontSize: 11,
    borderBottomWidth: 1,
    borderBottomStyle: 'dotted',
    borderBottomColor: '#999',
    height: 18,
  },
});

interface RouteCompletedReportPDFProps {
  route: CollectionRoute;
  producers: Producer[];
  cooperative: CooperativeInfo;
  collections: Collection[];
  distance: number;
  duration: number;
}

export default function RouteCompletedReportPDF({
  route,
  producers = [],
  cooperative = { name: 'SMARTCOOP', location: 'Abidjan', coordinates: [5.9309666, -4.2143906], certifications: [] },
  collections,
  distance,
  duration
}: RouteCompletedReportPDFProps) {
  // Définir la date du jour pour le formatage cohérent des dates
  const today = format(new Date(), 'dd MMMM yyyy', { locale: fr });

  const getProducerName = (producerId: string): string => {
    const producer = producers.find(p => p.id === producerId);
    return producer?.fullName || 'Producteur inconnu';
  };

  const getProducerPhone = (producerId: string): string => {
    const producer = producers.find(p => p.id === producerId);
    return producer?.phone || 'N/A';
  };

  const getCollectionForStop = (producerId: string): Collection | undefined => {
    return collections.find(c => c.producerId === producerId);
  };

  const getCompletedStops = () => {
    return route.stops.filter(stop => stop.status === 'completed');
  };

  const getTotalCollectedWeight = (): number => {
    return getCompletedStops().reduce((sum, stop) => sum + (stop.estimatedQuantity || 0), 0);
  };

  const getTotalBagCount = (): number => {
    return getCompletedStops().reduce((sum, stop) => sum + (stop.bagCount || 0), 0);
  };

  const getVillagesList = (): string => {
    const locations = route.stops.map(stop => stop.location);
    const uniqueLocations = [...new Set(locations)];
    return uniqueLocations.join(', ');
  };

  // Estimate fuel consumption (8L/100km)
  const estimateFuelConsumption = (): number => {
    return (distance * 8) / 100;
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'completed': return 'Complété';
      case 'cancelled': return 'Annulé';
      default: return 'En attente';
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <View style={styles.headerContent}>
            <View style={styles.cooperativeInfo}>
              <Text style={styles.cooperativeName}>{cooperative.name}</Text>
              <Text style={styles.cooperativeLocation}>{cooperative.location}</Text>
            </View>
          </View>
          <Text style={styles.title}>RAPPORT DE TOURNÉE</Text>
          <Text style={styles.subtitle}>Tournée: {route.name} - {format(route.date, 'dd MMMM yyyy', { locale: fr })}</Text>
        </View>

        {/* 1. Informations générales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Informations générales</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Date de la tournée:</Text>
            <Text style={styles.value}>{format(route.date, 'dd MMMM yyyy', { locale: fr })}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Heure de départ:</Text>
            <Text style={styles.value}>{route.startTime}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Heure d'arrivée:</Text>
            <Text style={styles.value}>{route.endTime || '18:00'}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Chauffeur:</Text>
            <Text style={styles.value}>{route.driver}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Accompagnants:</Text>
            <Text style={styles.value}>{route.participants?.join(', ') || 'Aucun'}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Villages visités:</Text>
            <Text style={styles.value}>{getVillagesList()}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Nombre d'arrêts:</Text>
            <Text style={styles.value}>{route.stops.length}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Arrêts complétés:</Text>
            <Text style={styles.value}>{getCompletedStops().length}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Quantité totale collectée:</Text>
            <Text style={styles.value}>{getTotalCollectedWeight().toFixed(2)} tonnes</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Nombre total de sacs:</Text>
            <Text style={styles.value}>{getTotalBagCount()} sacs</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Date de complétion:</Text>
            <Text style={styles.value}>
              {route.completedAt ? format(route.completedAt, 'dd MMMM yyyy', { locale: fr }) : 'N/A'}
            </Text>
          </View>
        </View>

        {/* 2. Détails par producteur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Détails par producteur</Text>
          
          {route.stops && route.stops.map((stop, index) => {
            const collection = getCollectionForStop(stop.producerId);
            
            return (
              <View key={index} style={styles.producerSection} wrap={false}>
                <View style={styles.producerHeader}>
                  <Text style={styles.producerName}>{getProducerName(stop.producerId)}</Text>
                  <Text style={[
                    styles.producerStatus,
                    stop.status === 'cancelled' ? styles.producerStatusCancelled : 
                    stop.status === 'pending' ? styles.producerStatusPending : {}
                  ]}>
                    {getStatusText(stop.status)}
                  </Text>
                </View>
                
                <View style={styles.producerDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Téléphone:</Text>
                    <Text style={styles.detailValue}>{getProducerPhone(stop.producerId)}</Text>
                  </View>
                  
                  {stop.status === 'completed' && (
                    <>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Nombre de sacs:</Text>
                        <Text style={styles.detailValue}>
                          {stop.bagCount || 'N/A'}
                        </Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Quantité collectée:</Text>
                        <Text style={styles.detailValue}>
                          {stop.estimatedQuantity?.toFixed(2) || 'N/A'} tonnes
                        </Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Qualité:</Text>
                        <Text style={styles.detailValue}>{stop.quality || 'N/A'}</Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Humidité:</Text>
                        <Text style={styles.detailValue}>
                          {stop.humidity ? `${stop.humidity}%` : 'N/A'}
                        </Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Heure de collecte:</Text>
                        <Text style={styles.detailValue}>
                          {collection?.date ? format(collection.date, 'HH:mm', { locale: fr }) : 'N/A'}
                        </Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Date de collecte:</Text>
                        <Text style={styles.detailValue}>
                          {collection?.date ? format(collection.date, 'dd/MM/yyyy', { locale: fr }) : 'N/A'}
                        </Text>
                      </View>
                    </>
                  )}
                  
                  {stop.status === 'cancelled' && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Raison d'annulation:</Text>
                      <Text style={styles.detailValue}>{stop.notes || 'Non spécifiée'}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Page break */}
        <View style={styles.pageBreak} />

        {/* 3. Données logistiques */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Données logistiques</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Distance totale:</Text>
            <Text style={styles.value}>{Math.round(distance)} km</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Durée estimée:</Text>
            <Text style={styles.value}>
              {Math.floor(duration / 60)}h{Math.round(duration % 60).toString().padStart(2, '0')}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Carburant estimé:</Text>
            <Text style={styles.value}>{estimateFuelConsumption().toFixed(2)} litres</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Point de départ:</Text>
            <Text style={styles.value}>
              {route.useCooperativeAsStart !== false ? cooperative.location : route.startLocation || 'Départ'}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Point d'arrivée:</Text>
            <Text style={styles.value}>
              {route.useCooperativeAsEnd !== false ? cooperative.location : route.endLocation || 'Arrivée'}
            </Text>
          </View>
          
          <Text style={[styles.sectionTitle, { marginTop: 10, fontSize: 12 }]}>Distances entre les points</Text>
          
          <View style={styles.logisticsTable}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCellWide}>Point de départ</Text>
              <Text style={styles.tableCellWide}>Point d'arrivée</Text>
              <Text style={styles.tableCellNarrow}>Distance</Text>
            </View>
            
            {route.stops && route.stops.map((stop, index) => {
              const producer = producers.find(p => p.id === stop.producerId);
              const nextStop = index < route.stops.length - 1 ? route.stops[index + 1] : null;
              const nextProducer = nextStop ? producers.find(p => p.id === nextStop.producerId) : null;
              
              if (!producer) return null;
              
              let distance = 0;
              let startPoint = '';
              let endPoint = '';
              
              // First stop
              if (index === 0) {
                startPoint = route.useCooperativeAsStart !== false ? 
                  cooperative.name : route.startLocation || 'Départ';
                endPoint = getProducerName(stop.producerId);
                
                if (route.useCooperativeAsStart !== false) {
                  distance = RouteCalculator.calculateDistance(
                    cooperative.coordinates, 
                    producer.coordinates
                  );
                }
              } 
              // Middle stops
              else {
                const prevProducer = producers.find(p => p.id === route.stops[index - 1].producerId);
                if (prevProducer) {
                  startPoint = getProducerName(route.stops[index - 1].producerId);
                  endPoint = getProducerName(stop.producerId);
                  distance = RouteCalculator.calculateDistance(
                    prevProducer.coordinates, 
                    producer.coordinates
                  );
                }
              }
              
              return (
                <View key={`segment-${index}`} style={styles.tableRow}>
                  <Text style={styles.tableCellWide}>{startPoint}</Text>
                  <Text style={styles.tableCellWide}>{endPoint}</Text>
                  <Text style={styles.tableCellNarrow}>{Math.round(distance)} km</Text>
                </View>
              );
            })}
            
            {/* Last segment back to end point */}
            {route.stops.length > 0 && (
              <View style={styles.tableRow}>
                <Text style={styles.tableCellWide}>
                  {getProducerName(route.stops[route.stops.length - 1].producerId)}
                </Text>
                <Text style={styles.tableCellWide}>
                  {route.useCooperativeAsEnd !== false ? 
                    cooperative.name : route.endLocation || 'Arrivée'}
                </Text>
                <Text style={styles.tableCellNarrow}>
                  {Math.round(
                    RouteCalculator.calculateDistance(
                      producers.find(p => p.id === route.stops[route.stops.length - 1].producerId)?.coordinates || [0, 0],
                      route.useCooperativeAsEnd !== false ? cooperative.coordinates : [0, 0]
                    )
                  )} km
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 4. Notes et imprévus */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Notes et imprévus</Text>
          
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Commentaires généraux</Text>
            <Text style={styles.notesText}>{route.notes || 'Aucune note enregistrée pour cette tournée.'}</Text>
          </View>
          
          {route.stops.some(stop => stop.status === 'cancelled') && (
            <View style={[styles.notesBox, { marginTop: 10 }]}>
              <Text style={styles.notesTitle}>Incidents rencontrés</Text>
              {route.stops
                .filter(stop => stop.status === 'cancelled')
                .map((stop, index) => (
                  <View key={index} style={{ marginBottom: 5 }}>
                    <Text style={[styles.notesText, { fontWeight: 'bold' }]}>
                      Arrêt annulé: {getProducerName(stop.producerId)}
                    </Text>
                    <Text style={styles.notesText}>
                      Raison: {stop.notes || 'Non spécifiée'}
                    </Text>
                  </View>
                ))
              }
            </View>
          )}
        </View>

        {/* 5. Dépenses */}
        <View style={styles.expensesSection}>
          <Text style={styles.sectionTitle}>5. Dépenses</Text>
          
          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>Carburant:</Text>
            <View style={styles.expenseValue} />
          </View>
          
          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>Péages:</Text>
            <View style={styles.expenseValue} />
          </View>
          
          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>Réparations:</Text>
            <View style={styles.expenseValue} />
          </View>
          
          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>Autres:</Text>
            <View style={styles.expenseValue} />
          </View>
          
          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>Total:</Text>
            <View style={styles.expenseValue} />
          </View>
        </View>

        {/* 6. Validation */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Signature du chauffeur</Text>
          </View>
          
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Signature du responsable</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer} fixed>
          Document généré le {today} - {cooperative?.name || 'SMARTCOOP'}
        </Text>
      </Page>
    </Document>
  );
}