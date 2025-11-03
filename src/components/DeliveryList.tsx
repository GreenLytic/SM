import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DeliveryOrder } from '../types/delivery';
import { Search, Plus } from 'lucide-react';
import Modal from './Modal';
import DeliveryTabs from './delivery/DeliveryTabs';

export default function DeliveryList() {
  return (
    <DeliveryTabs />
  );
}