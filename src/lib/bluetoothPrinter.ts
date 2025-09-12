// lib/bluetoothPrinter.ts

// Configuration type
type PrinterConfig = {
  serviceUUID: string;
  characteristicUUID: string;
};

// UUIDs courants pour les imprimantes Bluetooth
const COMMON_PRINTER_UUIDS = {
  // UUIDs standard pour les imprimantes thermiques
  STANDARD: {
    serviceUUID: '000018f0-0000-1000-8000-00805f9b34fb',
    characteristicUUID: '00002af1-0000-1000-8000-00805f9b34fb'
  },
  // UUIDs pour imprimantes Xprinter
  XPRINTER: {
    serviceUUID: '0000ae00-0000-1000-8000-00805f9b34fb',
    characteristicUUID: '0000ae01-0000-1000-8000-00805f9b34fb'
  },
  // UUIDs pour imprimantes Sunmi
  SUNMI: {
    serviceUUID: '0000fee0-0000-1000-8000-00805f9b34fb',
    characteristicUUID: '0000fee1-0000-1000-8000-00805f9b34fb'
  }
};

// Default config - on essaiera différents UUIDs
let printerConfig: PrinterConfig = COMMON_PRINTER_UUIDS.STANDARD;

// State variables
let connectedDevice: BluetoothDevice | null = null;
let connectedServer: BluetoothRemoteGATTServer | null = null;
let connectedCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

// Vérifie si Bluetooth est disponible
export const isBluetoothAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         !!navigator.bluetooth &&
         typeof navigator.bluetooth.getAvailability === 'function';
};

// Bluetooth initialization - FONCTION MANQUANTE AJOUTÉE
export const initializeBluetooth = async (): Promise<boolean> => {
  if (!isBluetoothAvailable()) {
    throw new Error('API Bluetooth non disponible dans ce navigateur. Utilisez Chrome ou Edge.');
  }
  
  try {
    return await navigator.bluetooth!.getAvailability();
  } catch (error) {
    throw new Error(`Erreur d'initialisation Bluetooth: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

// Essaye de se connecter avec différents UUIDs
export const connectToPrinter = async (): Promise<void> => {
  try {
    if (!await initializeBluetooth()) {
      throw new Error('Bluetooth non disponible sur cet appareil');
    }

    if (isPrinterConnected()) {
      return;
    }

    // Demander à l'utilisateur de sélectionner l'appareil
    const device = await navigator.bluetooth!.requestDevice({
      acceptAllDevices: true,
      optionalServices: Object.values(COMMON_PRINTER_UUIDS).flatMap(uuid => 
        [uuid.serviceUUID, uuid.characteristicUUID]
      )
    });

    if (!device.gatt) {
      throw new Error('Cet appareil Bluetooth ne supporte pas GATT');
    }

    const server = await device.gatt.connect();
    
    // Essayer différents UUIDs jusqu'à trouver le bon
    let connected = false;
    
    for (const [printerType, uuids] of Object.entries(COMMON_PRINTER_UUIDS)) {
      try {
        const service = await server.getPrimaryService(uuids.serviceUUID);
        const characteristic = await service.getCharacteristic(uuids.characteristicUUID);
        
        connectedDevice = device;
        connectedServer = server;
        connectedCharacteristic = characteristic;
        printerConfig = uuids;
        
        console.log(`Connecté à une imprimante de type: ${printerType}`);
        connected = true;
        break;
      } catch (error) {
        console.log(`UUIDs ${printerType} non valides, essai suivant...`);
        continue;
      }
    }

    if (!connected) {
      throw new Error('Impossible de trouver le service d\'impression. Vérifiez la compatibilité de l\'imprimante.');
    }

    // Gestion de la déconnexion
    device.addEventListener('gattserverdisconnected', () => {
      disconnectPrinter();
    });
  } catch (error) {
    disconnectPrinter();
    if (error instanceof Error && error.name === 'NotFoundError') {
      throw new Error('Aucun appareil Bluetooth sélectionné');
    }
    throw error;
  }
};

// Fonction pour envoyer des commandes ESC/POS
const sendEscPosCommands = async (commands: number[]): Promise<void> => {
  if (!connectedCharacteristic) {
    throw new Error('Imprimante non connectée');
  }

  try {
    // Diviser les commandes en chunks de 20 bytes maximum (limitation BLE)
    const chunkSize = 20;
    for (let i = 0; i < commands.length; i += chunkSize) {
      const chunk = commands.slice(i, i + chunkSize);
      await connectedCharacteristic.writeValueWithoutResponse(new Uint8Array(chunk));
      // Petit délai entre les chunks
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  } catch (error) {
    throw new Error(`Erreur d'envoi des commandes: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

// Print function for dental consultation
export const printConsultationTicket = async (
  clinic: {
    name: string;
    address?: string;
    phone?: string;
  },
  consultation: {
    date: string;
    patientName: string;
    patientPhone: string;
    dentist: {
      firstName: string;
      lastName: string;
    };
    amount: number;
    description?: string;
  }
): Promise<void> => {
  if (!isPrinterConnected()) {
    await connectToPrinter();
  }

  try {
    const encoder = new TextEncoder();
    
    // Commandes ESC/POS de base
    const commands = [
      0x1B, 0x40, // Initialize printer
      
      // En-tête de la clinique
      0x1B, 0x61, 0x01, // Center align
      0x1B, 0x45, 0x01, // Bold on
      ...encoder.encode(`${clinic.name.toUpperCase()}\n`),
      0x1B, 0x45, 0x00, // Bold off
      
      // Adresse et téléphone
      0x1B, 0x61, 0x00, // Left align
      ...(clinic.address ? encoder.encode(`${clinic.address}\n`) : []),
      ...(clinic.phone ? encoder.encode(`Tél: ${clinic.phone}\n`) : []),
      
      // Séparateur
      ...encoder.encode('--------------------------------\n'),
      
      // Titre
      0x1B, 0x61, 0x01, // Center align
      ...encoder.encode('CONSULTATION DENTAIRE\n'),
      0x1B, 0x61, 0x00, // Left align
      ...encoder.encode('--------------------------------\n'),
      
      // Détails consultation
      ...encoder.encode(`Date: ${new Date(consultation.date).toLocaleString('fr-FR')}\n`),
      ...encoder.encode(`Patient: ${consultation.patientName}\n`),
      ...encoder.encode(`Téléphone: ${consultation.patientPhone}\n\n`),
      
      ...encoder.encode(`Dentiste: ${consultation.dentist.firstName} ${consultation.dentist.lastName}\n`),
      ...encoder.encode(`Montant: ${consultation.amount.toLocaleString('fr-FR')} FCFA\n\n`),
      
      // Description
      ...(consultation.description ? [
        ...encoder.encode('Description:\n'),
        ...encoder.encode(`${consultation.description}\n\n`)
      ] : []),
      
      // Séparateur
      ...encoder.encode('--------------------------------\n'),
      
      // Pied de page
      0x1B, 0x61, 0x01, // Center align
      ...encoder.encode('Merci de votre visite\n'),
      
      // Espacement et coupe
      0x1B, 0x64, 0x03, // Feed 3 lines
      0x1D, 0x56, 0x41, 0x03 // Full cut
    ];

    await sendEscPosCommands(commands);
  } catch (error) {
    throw new Error(`Échec de l'impression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

// Fonction de test simple
export const testPrint = async (): Promise<void> => {
  if (!isPrinterConnected()) {
    await connectToPrinter();
  }

  try {
    const encoder = new TextEncoder();
    const testCommands = [
      0x1B, 0x40, // Initialize
      0x1B, 0x61, 0x01, // Center
      0x1B, 0x45, 0x01, // Bold
      ...encoder.encode('TEST IMPRIMANTE\n'),
      0x1B, 0x45, 0x00, // Bold off
      0x1B, 0x61, 0x00, // Left
      ...encoder.encode('Ceci est un test\n'),
      ...encoder.encode(new Date().toLocaleString('fr-FR') + '\n'),
      0x1D, 0x56, 0x41, 0x03 // Cut
    ];

    await sendEscPosCommands(testCommands);
  } catch (error) {
    throw new Error(`Test échoué: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

// Alternative : Utilisation d'une approche texte simple
export const printSimpleText = async (text: string): Promise<void> => {
  if (!isPrinterConnected()) {
    await connectToPrinter();
  }

  if (!connectedCharacteristic) {
    throw new Error('Imprimante non connectée');
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text + '\n\n\n'); // 3 sauts de ligne à la fin
    
    // Envoyer par chunks de 20 bytes
    const chunkSize = 20;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await connectedCharacteristic.writeValueWithoutResponse(chunk);
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  } catch (error) {
    throw new Error(`Échec de l'impression texte: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

// Disconnection
export const disconnectPrinter = (): void => {
  try {
    if (connectedServer?.connected) {
      connectedServer.disconnect();
    }
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
  } finally {
    connectedDevice = null;
    connectedServer = null;
    connectedCharacteristic = null;
  }
};

// Status checkers
export const isPrinterConnected = (): boolean => {
  return connectedServer?.connected || false;
};

export const getConnectedPrinterName = (): string | null => {
  return connectedDevice?.name || null;
};

export interface PrinterStatus {
  isConnected: boolean;
  printerName: string | null;
  device: BluetoothDevice | null;
  bluetoothAvailable: boolean;
}
// Fonction d'impression pour les tickets de traitement
export const printTreatmentTicket = async (
  clinic: {
    name: string;
    address?: string;
    phone?: string;
  },
  treatment: {
    patientName: string;
    patientPhone: string;
    date: string;
    treatmentType: string;
    amount: number;
   
  }
): Promise<void> => {
  if (!isPrinterConnected()) {
    await connectToPrinter();
  }

  try {
    const encoder = new TextEncoder();
    
    // Commandes ESC/POS pour le ticket de traitement
    const commands = [
      0x1B, 0x40, // Initialize printer
      
      // En-tête de la clinique
      0x1B, 0x61, 0x01, // Center align
      0x1B, 0x45, 0x01, // Bold on
      ...encoder.encode(`${clinic.name.toUpperCase()}\n`),
      0x1B, 0x45, 0x00, // Bold off
      
      // Adresse et téléphone
      0x1B, 0x61, 0x00, // Left align
      ...(clinic.address ? encoder.encode(`${clinic.address}\n`) : []),
      ...(clinic.phone ? encoder.encode(`Tél: ${clinic.phone}\n`) : []),
      
      // Séparateur
      ...encoder.encode('--------------------------------\n'),
      
      // Titre
      0x1B, 0x61, 0x01, // Center align
      ...encoder.encode('TRAITEMENT DENTAIRE\n'),
      0x1B, 0x61, 0x00, // Left align
      ...encoder.encode('--------------------------------\n'),
      
      ...encoder.encode(`Patient: ${treatment.patientName}\n`),
      ...encoder.encode(`Téléphone: ${treatment.patientPhone}\n`),
      ...encoder.encode(`Date: ${treatment.date}\n\n`),
      
      0x1B, 0x45, 0x01, // Bold on
      ...encoder.encode('DÉTAILS DU TRAITEMENT\n'),
      0x1B, 0x45, 0x00, 
      ...encoder.encode('--------------------------------\n'),
      
      ...encoder.encode(`Type: ${treatment.treatmentType}\n`),      
      // Informations financières
      0x1B, 0x45, 0x01, // Bold on
      ...encoder.encode('INFORMATIONS FINANCIÈRES\n'),
      0x1B, 0x45, 0x00, // Bold off
      ...encoder.encode('--------------------------------\n'),
      
      ...encoder.encode(`Total: ${treatment.amount.toLocaleString('fr-FR')} FCFA\n`),
      
      // Séparateur
      ...encoder.encode('--------------------------------\n'),
      
      // Pied de page
      0x1B, 0x61, 0x01, // Center align
      ...encoder.encode('Merci de votre confiance\n'),
      
      // Espacement et coupe
      0x1B, 0x64, 0x03, // Feed 3 lines
      0x1D, 0x56, 0x41, 0x03 // Full cut
    ];

    await sendEscPosCommands(commands);
  } catch (error) {
    throw new Error(`Échec de l'impression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

// Helper function pour le texte du statut
const getStatusText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'UNPAID': 'Non payé',
    'PAID': 'Payé',
    'PARTIAL': 'Partiellement payé'
  };
  return statusMap[status] || status;
};

export const getPrinterStatus = (): PrinterStatus => {
  return {
    isConnected: isPrinterConnected(),
    printerName: getConnectedPrinterName(),
    device: connectedDevice,
    bluetoothAvailable: isBluetoothAvailable()
  };
};

// Config setter pour sélectionner manuellement le type d'imprimante
export const setPrinterType = (type: keyof typeof COMMON_PRINTER_UUIDS) => {
  printerConfig = COMMON_PRINTER_UUIDS[type];
};

// Fonction pour obtenir la configuration actuelle
export const getPrinterConfig = (): PrinterConfig => {
  return printerConfig;
};