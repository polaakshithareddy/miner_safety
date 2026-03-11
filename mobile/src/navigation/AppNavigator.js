import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import WorkerDashboard from '../screens/dashboard/WorkerDashboard';
import SupervisorDashboard from '../screens/dashboard/SupervisorDashboard';
import AdminDashboard from '../screens/dashboard/AdminDashboard';
import HazardReport from '../screens/hazards/HazardReport';
import DailyChecklist from '../screens/checklist/DailyChecklist';
import VideoLibrary from '../screens/videos/VideoLibrary';
import IncidentList from '../screens/incidents/IncidentList';
import IncidentDetail from '../screens/incidents/IncidentDetail';
import CaseStudies from '../screens/cases/CaseStudies';
import CaseStudyDetail from '../screens/cases/CaseStudyDetail';
import MentalFitnessQuestionnaire from '../screens/checklist/MentalFitnessQuestionnaire';

import GasDetectionDashboard from '../screens/safety/GasDetectionDashboard';
import ProfileScreen from '../screens/profile/ProfileScreen';
import UserManagement from '../screens/admin/UserManagement';
import Reports from '../screens/admin/Reports';
import SOSAlertsManagement from '../screens/admin/SOSAlertsManagement';
import RiskHeatmapReport from '../screens/admin/RiskHeatmapReport';
import FeedScreen from '../screens/feed/FeedScreen';
import CreatePostScreen from '../screens/feed/CreatePostScreen';
import EditPostScreen from '../screens/feed/EditPostScreen';
import CommentsScreen from '../screens/feed/CommentsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import TeamListScreen from '../screens/teams/TeamListScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    // Main App Stack
                    <>
                        {user.role === 'admin' ? (
                            <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
                        ) : user.role === 'supervisor' ? (
                            <Stack.Screen name="SupervisorDashboard" component={SupervisorDashboard} />
                        ) : (
                            <Stack.Screen name="WorkerDashboard" component={WorkerDashboard} />
                        )}

                        <Stack.Screen name="HazardReport" component={HazardReport} />
                        <Stack.Screen name="DailyChecklist" component={DailyChecklist} />
                        <Stack.Screen name="VideoLibrary" component={VideoLibrary} />
                        <Stack.Screen name="IncidentList" component={IncidentList} />
                        <Stack.Screen name="ReportIncident" component={require('../screens/incidents/ReportIncident').default} />
                        <Stack.Screen name="IncidentDetail" component={IncidentDetail} />
                        <Stack.Screen name="CaseStudies" component={CaseStudies} />
                        <Stack.Screen name="CaseStudyDetail" component={CaseStudyDetail} />
                        <Stack.Screen name="MentalFitnessQuestionnaire" component={MentalFitnessQuestionnaire} />

                        <Stack.Screen name="GasDetectionDashboard" component={GasDetectionDashboard} />
                        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
                        <Stack.Screen name="UserManagement" component={UserManagement} />
                        <Stack.Screen name="Reports" component={Reports} />
                        <Stack.Screen name="SOSAlertsManagement" component={SOSAlertsManagement} />
                        <Stack.Screen name="RiskHeatmapReport" component={RiskHeatmapReport} />
                        <Stack.Screen name="FeedScreen" component={FeedScreen} />
                        <Stack.Screen name="CreatePost" component={CreatePostScreen} />
                        <Stack.Screen name="EditPost" component={EditPostScreen} />
                        <Stack.Screen name="Comments" component={CommentsScreen} />
                        <Stack.Screen name="Notifications" component={NotificationsScreen} />
                        <Stack.Screen name="TeamList" component={TeamListScreen} />
                    </>
                ) : (
                    // Auth Stack
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
