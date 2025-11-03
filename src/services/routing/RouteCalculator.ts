import * as turf from '@turf/turf';
import { Producer } from '../../types/producer';
import { CooperativeInfo } from '../../types/cooperative';
import { CollectionRoute } from '../../types/route';

export class RouteCalculator {
  static calculateDistance(point1: [number, number], point2: [number, number]): number {
    const from = turf.point([point1[1], point1[0]]);
    const to = turf.point([point2[1], point2[0]]);
    return turf.distance(from, to, { units: 'kilometers' });
  }

  static calculateTotalDistance(points: [number, number][]): number {
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      total += this.calculateDistance(points[i], points[i + 1]);
    }
    return total;
  }

  static estimateDuration(distance: number): number {
    const averageSpeed = 40; // km/h
    return (distance / averageSpeed) * 60; // Convert to minutes
  }

  static orderProducersByDistance(producers: Producer[], cooperative: CooperativeInfo): Producer[] {
    const start = cooperative.coordinates;
    let remaining = [...producers];
    const ordered: Producer[] = [];
    let current = start;

    while (remaining.length > 0) {
      let nearest = remaining[0];
      let minDistance = this.calculateDistance(current, nearest.coordinates);

      for (const producer of remaining) {
        const distance = this.calculateDistance(current, producer.coordinates);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = producer;
        }
      }

      ordered.push(nearest);
      remaining = remaining.filter(p => p.id !== nearest.id);
      current = nearest.coordinates;
    }

    return ordered;
  }

  static calculateFuelConsumption(distance: number, consumption: number = 8): number {
    // consumption in L/100km
    return (distance * consumption) / 100;
  }

  static calculateSegmentDistances(points: [number, number][]): number[] {
    const distances: number[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      distances.push(this.calculateDistance(points[i], points[i + 1]));
    }
    return distances;
  }

  static optimizeRoute(points: [number, number][]): [number, number][] {
    // Simple nearest neighbor algorithm
    if (points.length <= 2) return points;
    
    const start = points[0]; // Cooperative is always the start
    const pointsToVisit = points.slice(1);
    const optimizedRoute = [start];
    let currentPoint = start;
    
    while (pointsToVisit.length > 0) {
      let nearestIndex = 0;
      let minDistance = this.calculateDistance(currentPoint, pointsToVisit[0]);
      
      for (let i = 1; i < pointsToVisit.length; i++) {
        const distance = this.calculateDistance(currentPoint, pointsToVisit[i]);
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }
      
      currentPoint = pointsToVisit[nearestIndex];
      optimizedRoute.push(currentPoint);
      pointsToVisit.splice(nearestIndex, 1);
    }
    
    optimizedRoute.push(start); // Return to start
    return optimizedRoute;
  }

  static calculateRouteDistance(route: CollectionRoute, producers: Producer[], cooperative: CooperativeInfo): number {
    if (!route.stops.length) return 0;
    
    // Vérifier si cooperative est défini, sinon utiliser des valeurs par défaut
    const coopCoordinates = cooperative?.coordinates || [5.9309666, -4.2143906];
    
    // Déterminer les points de départ et d'arrivée
    const startPoint = route.useCooperativeAsStart !== false ? 
      coopCoordinates : 
      producers.find(p => p.id === route.stops[0].producerId)?.coordinates || coopCoordinates;
    
    const endPoint = route.useCooperativeAsEnd !== false ? 
      coopCoordinates : 
      producers.find(p => p.id === route.stops[route.stops.length - 1].producerId)?.coordinates || coopCoordinates;
    
    // Créer la liste des points dans l'ordre
    const points: [number, number][] = [startPoint];
    
    // Ajouter tous les arrêts
    for (const stop of route.stops) {
      const producer = producers.find(p => p.id === stop.producerId);
      if (producer?.coordinates) {
        points.push(producer.coordinates);
      }
    }
    
    // Ajouter le point d'arrivée si différent du dernier arrêt
    if (points[points.length - 1] !== endPoint) {
      points.push(endPoint);
    }
    
    // Calculer la distance totale
    return this.calculateTotalDistance(points);
  }
}