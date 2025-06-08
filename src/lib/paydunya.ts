interface PaydunyaConfig {
    baseUrl: string;
    headers: Record<string, string>;
    isTest: boolean;
  }
  
  export const getPaydunyaConfig = (): PaydunyaConfig => {
    const isTest = process.env.PAYDUNYA_MODE === 'test';
    
    return {
      isTest,
      baseUrl: isTest 
        ? 'https://app.paydunya.com/sandbox-api/v1' 
        : 'https://api.paydunya.com/v1',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY!,
        'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY!,
        'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN!
      }
    };
  };
  
  export const getAppBaseUrl = (): string => {
    return process.env.NGROK_URL || process.env.NEXT_PUBLIC_APP_URL!;
  };