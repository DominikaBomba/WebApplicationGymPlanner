import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_PLANS_KEY = '@GymPlanner_OfflinePlans';

export const getOfflinePlans = async (): Promise<any[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(OFFLINE_PLANS_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error("Error reading offline plans", e);
        return [];
    }
};

export const isPlanOffline = async (planId: number): Promise<boolean> => {
    const plans = await getOfflinePlans();
    return plans.some((p: any) => p.id === planId);
};

export const savePlanOffline = async (plan: any): Promise<boolean> => {
    try {
        const plans = await getOfflinePlans();
        if (!plans.some((p: any) => p.id === plan.id)) {
            plans.push(plan);
            await AsyncStorage.setItem(OFFLINE_PLANS_KEY, JSON.stringify(plans));
        }
        return true;
    } catch (e) {
        console.error("Error saving plan", e);
        return false;
    }
};

export const removePlanOffline = async (planId: number): Promise<boolean> => {
    try {
        const plans = await getOfflinePlans();
        const filtered = plans.filter((p: any) => p.id !== planId);
        await AsyncStorage.setItem(OFFLINE_PLANS_KEY, JSON.stringify(filtered));
        return true;
    } catch (e) {
        console.error("Error removing plan", e);
        return false;
    }
};