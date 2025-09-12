// types/global.d.ts

declare global {
  interface Navigator {
    bluetooth?: {
      getAvailability(): Promise<boolean>;
      requestDevice(options: BluetoothRequestDeviceOptions): Promise<BluetoothDevice>;
    };
  }

  interface BluetoothRequestDeviceOptions {
    acceptAllDevices?: boolean;
    optionalServices?: string[];
    filters?: BluetoothLEScanFilter[];
  }

  interface BluetoothLEScanFilter {
    services?: string[];
    name?: string;
    namePrefix?: string;
  }

  interface BluetoothDevice {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
  }

  interface BluetoothRemoteGATTServer {
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
    connected: boolean;
    device: BluetoothDevice;
  }

  interface BluetoothRemoteGATTService {
    getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
    getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
  }

  interface BluetoothRemoteGATTCharacteristic {
    writeValue(value: BufferSource): Promise<void>;
    writeValueWithoutResponse(value: BufferSource): Promise<void>;
    readValue(): Promise<DataView>;
    startNotifications(): Promise<void>;
    stopNotifications(): Promise<void>;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
  }
}

export {};