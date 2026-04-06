import { Platform } from 'react-native';

//Api url configuration (depending on testing env)
const getApiUrl = () => {
    // npm start -> w
    if (Platform.OS === 'web') {
        return 'http://localhost:3000';
    }

    // npm start -> a
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:3000';
    }

    //telefon po wi-fi (odkomentować)
    return 'http://[ipconfig]:3000';
};

export const API_URL = getApiUrl();