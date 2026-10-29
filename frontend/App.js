import React, { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { apiRequest, mapLicitation } from './src/services/api';
import {
  ArrowLeft,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Download,
  FileText,
  Home,
  Search,
  ShieldCheck,
  UploadCloud,
  UserCheck,
} from 'lucide-react-native';

const Stack = createStackNavigator();

const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const validatePassword = (value) => value.trim().length >= 6;
const validateRif = (value) => /^[JEVGCP]-\d{8}-\d$/i.test(value.trim());
const isWeb = Platform.OS === 'web';

function LoginScreen({ navigation }) {
  const [rif, setRif] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Datos incompletos', 'Completa todos los campos para continuar.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Correo inválido', 'Ingresa un correo corporativo válido.');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (rif && !validateRif(rif)) {
      Alert.alert('RIF inválido', 'Ejemplo válido: J-00000000-9');
      return;
    }

    setIsChecking(true);
    try {
      const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (rif && result.company.rif.toUpperCase() !== rif.trim().toUpperCase()) {
        throw new Error('El RIF ingresado no coincide con la empresa de esta cuenta.');
      }

      navigation.replace('Home', {
        session: {
          ...result.company,
          token: result.token,
        },
      });
    } catch (error) {
      Alert.alert('No se pudo iniciar sesión', error.message);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.contentCenter}>
          <View style={styles.logoBox}>
            <ShieldCheck size={28} color="#60a5fa" />
          </View>

          <Text style={styles.eyebrow}>Acceso empresarial</Text>
          <Text style={styles.heroTitle}>Licitaciones VZLA</Text>
          <Text style={styles.heroSubtitle}>Gestiona postulaciones públicas y privadas desde tu celular.</Text>

          <View style={styles.formCard}>
            <Text style={styles.label}>Correo corporativo</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="empresa@correo.com" keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.passwordWrap}>
              <TextInput style={styles.passwordInput} value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry={!showPassword} />
              <Pressable onPress={() => setShowPassword((prev) => !prev)} style={styles.showPasswordButton}>
                <Text style={styles.showPasswordText}>{showPassword ? 'Ocultar' : 'Ver'}</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>RIF</Text>
            <TextInput style={styles.input} value={rif} onChangeText={setRif} placeholder="J-00000000-9" autoCapitalize="characters" />

            <Pressable style={[styles.primaryButton, isChecking && styles.primaryButtonDisabled]} onPress={handleLogin} disabled={isChecking}>
              <Text style={styles.primaryButtonText}>{isChecking ? 'Validando...' : 'Iniciar sesión'}</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Crear cuenta de empresa</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RegisterScreen({ navigation }) {
  const [razonSocial, setRazonSocial] = useState('');
  const [rif, setRif] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async () => {
    if (!razonSocial.trim() || !rif.trim() || !email.trim() || !password) {
      Alert.alert('Datos incompletos', 'Completa razón social, RIF, correo y contraseña.');
      return;
    }

    if (!validateRif(rif)) {
      Alert.alert('RIF inválido', 'Ejemplo válido: J-00000000-9');
      return;
    }

    if (!validateEmail(email) || !validatePassword(password)) {
      Alert.alert('Datos inválidos', 'Verifica el correo y usa una contraseña de al menos 6 caracteres.');
      return;
    }

    setIsRegistering(true);
    try {
      const result = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          razonSocial: razonSocial.trim(),
          rif: rif.trim().toUpperCase(),
          email: email.trim(),
          password,
          telefono: telefono.trim() || undefined,
        }),
      });

      navigation.replace('Home', {
        session: { ...result.company, token: result.token },
      });
    } catch (error) {
      Alert.alert('No se pudo crear la cuenta', error.message);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.contentCenter}>
          <View style={styles.logoBox}>
            <ShieldCheck size={28} color="#60a5fa" />
          </View>
          <Text style={styles.eyebrow}>Registro empresarial</Text>
          <Text style={styles.heroTitle}>Crear cuenta</Text>
          <View style={styles.formCard}>
            <Text style={styles.label}>Razón social</Text>
            <TextInput style={styles.input} value={razonSocial} onChangeText={setRazonSocial} autoCapitalize="words" />
            <Text style={styles.label}>RIF</Text>
            <TextInput style={styles.input} value={rif} onChangeText={setRif} placeholder="J-00000000-9" autoCapitalize="characters" />
            <Text style={styles.label}>Correo corporativo</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Text style={styles.label}>Teléfono (opcional)</Text>
            <TextInput style={styles.input} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
            <Text style={styles.label}>Contraseña</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
            <Pressable style={[styles.primaryButton, isRegistering && styles.primaryButtonDisabled]} onPress={handleRegister} disabled={isRegistering}>
              <Text style={styles.primaryButtonText}>{isRegistering ? 'Creando cuenta...' : 'Registrarme'}</Text>
            </Pressable>
            <Pressable onPress={() => navigation.goBack()}>
              <Text style={styles.footerLink}>Ya tengo una cuenta</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function HomeScreen({ navigation, route }) {
  const [searchText, setSearchText] = useState('');
  const [selectedSector, setSelectedSector] = useState('Todos');
  const [selectedStatus, setSelectedStatus] = useState('Todas');
  const [activeTab, setActiveTab] = useState('home');
  const [licitaciones, setLicitaciones] = useState([]);
  const [submittedProposals, setSubmittedProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [bidsError, setBidsError] = useState('');
  const [currentTime, setCurrentTime] = useState('11:10 AM');

  const session = route.params.session;
  const companyProfile = {
    rif: session.rif,
    name: session.razonSocial,
    email: session.email,
    phone: session.telefono || 'No disponible',
  };

  const loadDashboard = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const result = await apiRequest('/licitations');
      setLicitaciones(result.map(mapLicitation));
    } catch (error) {
      setLoadError(error.message);
    }

    try {
      const bids = await apiRequest('/bids/my-bids', { token: session.token });
      setSubmittedProposals(bids);
      setBidsError('');
    } catch (error) {
      setBidsError(`No se pudieron cargar tus postulaciones: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [session.token, route.params?.refreshKey]);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('es-VE', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 30000);
    return () => clearInterval(timer);
  }, []);

  const allLicitaciones = licitaciones;

  const filteredLicitaciones = useMemo(() => {
    return allLicitaciones.filter((item) => {
      const query = searchText.toLowerCase();
      const matchesSearch =
        item.title.toLowerCase().includes(query) ||
        item.organization.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query);
      const matchesSector = selectedSector === 'Todos' || item.sector === selectedSector;
      const matchesStatus =
        selectedStatus === 'Todas' ||
        (selectedStatus === 'Abiertas' && item.status === 'Abierta');
      return matchesSearch && matchesSector && matchesStatus;
    });
  }, [allLicitaciones, searchText, selectedSector, selectedStatus]);

  const renderCatalog = () => (
    <View style={styles.spaceY}>
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <View style={styles.kpiIconBlue}><BriefcaseBusiness size={16} color="#60a5fa" /></View>
          <View style={styles.kpiTextWrap}>
            <Text style={styles.kpiLabel}>Licitaciones activas</Text>
            <Text style={styles.kpiValue}>{allLicitaciones.length} Disponibles</Text>
          </View>
        </View>

        <View style={styles.kpiCard}>
          <View style={styles.kpiIconGreen}><ShieldCheck size={16} color="#4ade80" /></View>
          <View style={styles.kpiTextWrap}>
            <Text style={styles.kpiLabel}>Estatus RNC</Text>
            <Text style={styles.kpiValueGreen}>{submittedProposals.length} postulaciones</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Search size={16} color="#94a3b8" />
        <TextInput style={styles.searchInput} placeholder="Buscar por obra, ente o código..." value={searchText} onChangeText={setSearchText} />
      </View>

      <View style={styles.filterGroup}>
        <View style={styles.filterHeaderRow}>
          <Text style={styles.filterHeader}>Sector económico</Text>
          <Text style={styles.filterCounter}>{filteredLicitaciones.length} encontrados</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
          {['Todos', 'General'].map((sector) => (
            <Pressable key={sector} style={[styles.chip, selectedSector === sector && styles.chipActive]} onPress={() => setSelectedSector(sector)}>
              <Text style={[styles.chipText, selectedSector === sector && styles.chipTextActive]}>{sector}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.statusRow}>
          {['Todas', 'Abiertas'].map((status) => (
            <Pressable key={status} style={[styles.statusChip, selectedStatus === status && styles.statusChipActive]} onPress={() => setSelectedStatus(status)}>
              <Text style={[styles.statusChipText, selectedStatus === status && styles.statusChipTextActive]}>{status}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.cardList}>
        {loadError ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No se pudo cargar el catálogo</Text>
            <Text style={styles.emptyText}>{loadError}</Text>
            <Pressable style={styles.primaryButton} onPress={loadDashboard}>
              <Text style={styles.primaryButtonText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}
        {bidsError ? <Text style={styles.emptyText}>{bidsError}</Text> : null}
        {isLoading && !loadError ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Cargando licitaciones...</Text>
          </View>
        ) : null}
        {filteredLicitaciones.length === 0 ? (
          !isLoading && !loadError ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No hay resultados</Text>
              <Text style={styles.emptyText}>Prueba con otra palabra clave o vuelve a cargar el catálogo.</Text>
            </View>
          ) : null
        ) : (
          filteredLicitaciones.map((item) => (
            <Pressable key={item.id} style={styles.card} onPress={() => navigation.navigate('Detail', { licitacion: item, session })}>
              <View style={styles.cardTop}>
                <Text style={styles.code}>{item.id}</Text>
                <Text style={[styles.statusPill, item.status === 'Abierta' ? styles.statusOpen : styles.statusReview]}>{item.status}</Text>
              </View>

              <Text style={styles.cardTitle}>{item.title}</Text>

              <View style={styles.cardMetaRow}>
                <Building2 size={13} color="#60a5fa" />
                <Text style={styles.cardMetaText}>{item.organization}</Text>
              </View>

              <View style={styles.cardInfoGrid}>
                <View style={styles.cardInfoBox}>
                  <Text style={styles.infoLabel}>Ubicación</Text>
                  <Text style={styles.infoValue}>{item.location || 'Caracas, Venezuela'}</Text>
                </View>
                <View style={styles.cardInfoBox}>
                  <Text style={styles.infoLabel}>Monto</Text>
                  <Text style={styles.infoValueGreen}>{item.budgetUsd || item.budget}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.footerLeft}>
                  {item.daysLeft === null ? item.deadline : `Cierra en ${item.daysLeft} días`}
                </Text>
                <Text style={styles.footerLink}>Ver pliego</Text>
              </View>
            </Pressable>
          ))
        )}
      </View>
    </View>
  );

  const renderMetrics = () => (
    <View style={styles.spaceY}>
      <View style={styles.panel}>
        <View style={styles.panelHeaderRow}>
          <Text style={styles.panelTitle}>Resumen de actividad</Text>
          <Text style={styles.panelMeta}>Datos de la API</Text>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Licitaciones disponibles</Text>
            <Text style={styles.metricBigBlue}>{allLicitaciones.length}</Text>
            <Text style={styles.metricTrend}>En el catálogo actual</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Postulaciones enviadas</Text>
            <Text style={styles.metricBigGreen}>{submittedProposals.length}</Text>
            <Text style={styles.metricTrend}>De esta empresa</Text>
          </View>
        </View>
        <Text style={styles.metricTrend}>El backend todavía no ofrece estadísticas financieras agregadas ni datos del RNC.</Text>
      </View>
    </View>
  );

  const renderApplications = () => (
    <View style={styles.spaceY}>
      <View style={styles.listHeaderRow}>
        <Text style={styles.sectionTitle}>Historial de postulaciones</Text>
        <Text style={styles.metaText}>{submittedProposals.length} enviadas</Text>
      </View>

      {bidsError ? <Text style={styles.emptyText}>{bidsError}</Text> : null}
      {submittedProposals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Todavía no has enviado postulaciones.</Text>
        </View>
      ) : submittedProposals.map((app) => (
        <View key={app.id} style={styles.applicationCard}>
          <View style={styles.appHeaderRow}>
            <Text style={styles.appId}>{app.id}</Text>
            <Text style={styles.appStatus}>{app.status}</Text>
          </View>
          <Text style={styles.appTitle}>{app.licitationTitle || app.licitationId}</Text>
          <Text style={styles.appEntity}>
            Enviada: {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('es-VE') : 'Fecha no disponible'}
          </Text>
          <View style={styles.appHashBox}>
            <Text style={styles.hashLabel}>Archivo de propuesta</Text>
            <Text style={styles.hashValueSmall}>{app.pdfUrl}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderProfile = () => (
    <View style={styles.spaceY}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{companyProfile.name.charAt(0)}</Text></View>
        <Text style={styles.profileName}>{companyProfile.name}</Text>
        <Text style={styles.profileRif}>RIF: {companyProfile.rif}</Text>
        <View style={styles.rncBadge}>
          <ShieldCheck size={16} color="#4ade80" />
          <Text style={styles.rncBadgeText}>Cuenta autenticada</Text>
        </View>
      </View>

      <View style={styles.profilePanel}>
        <Text style={styles.profilePanelTitle}>Datos de la empresa</Text>
        <View style={styles.rowInfo}><Text style={styles.rowLabel}>Correo:</Text><Text style={styles.rowValue}>{companyProfile.email}</Text></View>
        <View style={styles.rowInfo}><Text style={styles.rowLabel}>Teléfono:</Text><Text style={styles.rowValue}>{companyProfile.phone}</Text></View>
        <View style={styles.rowInfo}><Text style={styles.rowLabel}>Registro RNC:</Text><Text style={styles.rowValue}>No disponible en la API</Text></View>
      </View>
    </View>
  );

  if (isWeb) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        <View style={styles.webStage}>
          <View style={styles.webPanel}>
            <View style={styles.webHeader}>
              <View style={styles.brandWrap}>
                <View style={styles.brandLogo}><Text style={styles.brandText}>LV</Text></View>
                <View>
                  <Text style={styles.brandTitle}>Licitaciones VZLA</Text>
                  <Text style={styles.brandSubtitle}>Panel de compras</Text>
                </View>
              </View>

              <View style={styles.webHeaderRight}>
                <View style={styles.webHeaderChip}>
                  <Text style={styles.webHeaderChipText}>{currentTime}</Text>
                </View>
                <Text style={styles.companyName}>{companyProfile.name}</Text>
              </View>
            </View>

            <View style={styles.webWorkspace}>
              <View style={styles.webSidebar}>
                <View style={styles.webSidebarCard}>
                  <Text style={styles.webSidebarLabel}>Resumen</Text>
                  <Text style={styles.webSidebarValue}>{allLicitaciones.length}</Text>
                  <Text style={styles.webSidebarMeta}>licitaciones disponibles</Text>
                </View>

                <View style={styles.webSidebarCard}>
                  <Text style={styles.webSidebarLabel}>RNC</Text>
                  <Text style={styles.webSidebarValueSmall}>Autenticada</Text>
                  <Text style={styles.webSidebarMeta}>{companyProfile.rif}</Text>
                </View>

                <View style={styles.webSidebarCard}>
                  <Text style={styles.webSidebarLabel}>Acciones rápidas</Text>
                  {['Catálogo', 'Métricas', 'Postulaciones', 'RNC'].map((item) => (
                    <Pressable
                      key={item}
                      style={[styles.webMenuItem, activeTab === item.toLowerCase().replace(/ /g, '') && styles.webMenuItemActive]}
                      onPress={() => {
                        const map = { catalogo: 'home', métricas: 'stats', postulaciones: 'applications', rnc: 'profile' };
                        setActiveTab(map[item.toLowerCase().replace(/ /g, '')] || 'home');
                      }}
                    >
                      <Text style={[styles.webMenuText, activeTab === item.toLowerCase().replace(/ /g, '') && styles.webMenuTextActive]}>{item}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.webContentPane}>
                <View style={styles.webToolbar}>
                  <View style={styles.searchBox}>
                    <Search size={16} color="#94a3b8" />
                    <TextInput style={styles.searchInput} placeholder="Buscar licitación, entidad o código..." value={searchText} onChangeText={setSearchText} />
                  </View>

                  <View style={styles.webQuickFilters}> 
                    {['Todos', 'General'].map((sector) => (
                      <Pressable
                        key={sector}
                        style={[styles.chip, selectedSector === sector && styles.chipActive]}
                        onPress={() => setSelectedSector(sector)}
                      >
                        <Text style={[styles.chipText, selectedSector === sector && styles.chipTextActive]}>{sector}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.webOverview}>
                  <View>
                    <Text style={styles.webOverviewEyebrow}>Panel ejecutivo</Text>
                    <Text style={styles.webOverviewTitle}>Oportunidades de contratación</Text>
                  </View>
                  <Pressable style={styles.webPrimaryAction} onPress={() => setActiveTab('applications')}>
                    <Text style={styles.webPrimaryActionText}>Ver postulaciones</Text>
                  </Pressable>
                </View>

                <View style={styles.webStatsRow}>
                  <View style={styles.webStatCard}>
                    <Text style={styles.webStatLabel}>Activas</Text>
                    <Text style={styles.webStatValue}>{allLicitaciones.length}</Text>
                  </View>
                  <View style={styles.webStatCard}>
                    <Text style={styles.webStatLabel}>En revisión</Text>
                    <Text style={styles.webStatValue}>{submittedProposals.length}</Text>
                  </View>
                  <View style={styles.webStatCard}>
                    <Text style={styles.webStatLabel}>RNC</Text>
                    <Text style={styles.webStatValueGreen}>{submittedProposals.length} enviadas</Text>
                  </View>
                </View>

                <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainContent}>
                  {activeTab === 'home' && renderCatalog()}
                  {activeTab === 'stats' && renderMetrics()}
                  {activeTab === 'applications' && renderApplications()}
                  {activeTab === 'profile' && renderProfile()}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.phoneShell}>
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>{currentTime}</Text>
          <View style={styles.notch} />
          <View style={styles.networkIcons}><Text style={styles.networkIcon}>◔</Text><Text style={styles.networkIcon}>▣</Text></View>
        </View>

        <View style={styles.topBar}>
          <View style={styles.brandWrap}>
            <View style={styles.brandLogo}><Text style={styles.brandText}>LV</Text></View>
            <View>
              <Text style={styles.brandTitle}>Licitaciones VZLA</Text>
              <Text style={styles.brandSubtitle}>República Bolivariana</Text>
            </View>
          </View>
          <View style={styles.companyWrap}>
            <Text style={styles.companySmall}>RIF: {companyProfile.rif}</Text>
            <Text style={styles.companyName}>{companyProfile.name}</Text>
          </View>
        </View>

        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainContent}>
          {activeTab === 'home' && renderCatalog()}
          {activeTab === 'stats' && renderMetrics()}
          {activeTab === 'applications' && renderApplications()}
          {activeTab === 'profile' && renderProfile()}
        </ScrollView>

        <View style={styles.bottomNav}>
          {[
            { key: 'home', label: 'Catálogo', icon: <Home size={16} color={activeTab === 'home' ? '#60a5fa' : '#94a3b8'} /> },
            { key: 'stats', label: 'Métricas', icon: <BarChart3 size={16} color={activeTab === 'stats' ? '#60a5fa' : '#94a3b8'} /> },
            { key: 'applications', label: 'Postulaciones', icon: <FileText size={16} color={activeTab === 'applications' ? '#60a5fa' : '#94a3b8'} /> },
            { key: 'profile', label: 'RNC / RIF', icon: <UserCheck size={16} color={activeTab === 'profile' ? '#60a5fa' : '#94a3b8'} /> },
          ].map((item) => (
            <Pressable key={item.key} style={styles.navItem} onPress={() => setActiveTab(item.key)}>
              {item.icon}
              <Text style={[styles.navText, activeTab === item.key && styles.navTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

function DetailScreen({ route, navigation }) {
  const { licitacion, session } = route.params;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.detailContent}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color="#dfe7f2" />
          <Text style={styles.backText}>Volver</Text>
        </Pressable>

        <View style={styles.detailCard}>
          <View style={styles.cardTop}>
            <Text style={styles.code}>{licitacion.id}</Text>
            <Text style={[styles.statusPill, licitacion.status === 'Abierta' ? styles.statusOpen : styles.statusReview]}>{licitacion.status}</Text>
          </View>

          <Text style={styles.detailTitle}>{licitacion.title}</Text>
          <Text style={styles.detailOrg}>{licitacion.organization}</Text>

          <View style={styles.detailGrid}>
            <View style={styles.detailBox}>
              <Text style={styles.infoLabel}>Presupuesto</Text>
              <Text style={styles.infoValueGreen}>{licitacion.budget}</Text>
            </View>
            <View style={styles.detailBox}>
              <Text style={styles.infoLabel}>Vence</Text>
              <Text style={styles.infoValue}>{licitacion.deadline}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.paragraph}>{licitacion.description}</Text>

          <Text style={styles.sectionTitle}>Requisitos</Text>
          {licitacion.requirements.map((requirement) => (
            <View key={requirement} style={styles.requirementRow}>
              <CheckCircle2 size={16} color="#4ade80" />
              <Text style={styles.requirementText}>{requirement}</Text>
            </View>
          ))}

          <Text style={styles.sectionTitle}>Pliegos adjuntos</Text>
          {licitacion.attachments.map((file) => (
            <View key={file} style={styles.attachmentRow}>
              <FileText size={18} color="#60a5fa" />
              <Text style={styles.attachmentText}>{file}</Text>
              <Download size={16} color="#94a3b8" />
            </View>
          ))}

          <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Apply', { licitacion, session })}>
            <Text style={styles.primaryButtonText}>Postularme</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ApplyScreen({ route, navigation }) {
  const { licitacion, session } = route.params;
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.[0]) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('No se pudo seleccionar el archivo', error.message);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      Alert.alert('Falta el archivo', 'Adjunta tu propuesta en PDF para continuar.');
      return;
    }

    const formData = new FormData();
    formData.append('licitation_id', licitacion.id);
    if (Platform.OS === 'web' && selectedFile.file) {
      formData.append('file', selectedFile.file, selectedFile.name);
    } else {
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || 'application/pdf',
      });
    }

    setIsUploading(true);
    try {
      await apiRequest('/bids', {
        method: 'POST',
        body: formData,
        token: session.token,
      });
      Alert.alert('Postulación enviada', 'La propuesta fue recibida por el backend.');
      navigation.navigate('Home', { session, refreshKey: Date.now() });
    } catch (error) {
      Alert.alert('No se pudo enviar la postulación', error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.detailContent}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color="#dfe7f2" />
          <Text style={styles.backText}>Cancelar</Text>
        </Pressable>

        <View style={styles.detailCard}>
          <Text style={styles.cardTitle}>Formulario de postulación</Text>
          <Text style={styles.detailOrg}>{licitacion.title}</Text>

          <Text style={styles.label}>Cargar propuesta técnica y financiera (PDF)</Text>
          <Pressable style={styles.uploadBox} onPress={pickPdf} disabled={isUploading}>
            <UploadCloud size={20} color="#60a5fa" />
            <Text style={styles.uploadText}>{selectedFile ? selectedFile.name : 'Adjuntar PDF'}</Text>
            {isUploading && <Text style={styles.uploadProgress}>Enviando propuesta...</Text>}
          </Pressable>

          <Pressable style={[styles.primaryButton, isUploading && styles.primaryButtonDisabled]} onPress={handleSubmit} disabled={isUploading}>
            <Text style={styles.primaryButtonText}>{isUploading ? 'Enviando...' : 'Transmitir postulación oficial'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Detail" component={DetailScreen} />
        <Stack.Screen name="Apply" component={ApplyScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#020817' },
  keyboardView: { flex: 1 },
  contentCenter: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#020817' },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#1d4ed8',
    shadowOpacity: 0.35,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
  },
  eyebrow: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', color: '#60a5fa', letterSpacing: 0.8 },
  heroTitle: { fontSize: 36, fontWeight: '800', color: '#f8fafc', marginTop: 8 },
  heroSubtitle: { fontSize: 14, color: '#94a3b8', lineHeight: 22, marginBottom: 24 },
  formCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  label: { fontSize: 12, fontWeight: '700', color: '#cbd5e1', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: '#020817', borderColor: '#1e293b', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#f8fafc' },
  passwordWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#020817', borderColor: '#1e293b', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  passwordInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#f8fafc' },
  showPasswordButton: { paddingVertical: 8, paddingHorizontal: 6 },
  showPasswordText: { color: '#60a5fa', fontWeight: '700', fontSize: 12 },
  primaryButton: { marginTop: 20, backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#2563eb', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  phoneShell: { flex: 1, backgroundColor: '#020817', borderRadius: 40, margin: 8, overflow: 'hidden', borderWidth: 2, borderColor: '#1e293b' },
  statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#020817', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 8 },
  statusText: { color: '#e2e8f0', fontSize: 11, fontWeight: '600' },
  notch: { width: 110, height: 16, borderRadius: 999, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' },
  networkIcons: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  networkIcon: { color: '#cbd5e1', fontSize: 10 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingHorizontal: 14, paddingVertical: 12 },
  brandWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandLogo: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#1d4ed8', alignItems: 'center', justifyContent: 'center', shadowColor: '#1d4ed8', shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
  brandText: { color: '#ffffff', fontWeight: '900', fontSize: 15 },
  brandTitle: { color: '#f8fafc', fontWeight: '900', fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase' },
  brandSubtitle: { color: '#94a3b8', fontSize: 9 },
  companyWrap: { alignItems: 'flex-end', maxWidth: 130 },
  companySmall: { color: '#cbd5e1', fontFamily: 'monospace', fontSize: 9 },
  companyName: { color: '#93c5fd', fontSize: 10, fontWeight: '600' },
  mainScroll: { flex: 1, backgroundColor: '#020817' },
  mainContent: { padding: 14, paddingBottom: 20 },
  spaceY: { gap: 14 },
  kpiGrid: { flexDirection: 'row', gap: 10 },
  kpiCard: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 10, gap: 8 },
  kpiIconBlue: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#1d4ed8', alignItems: 'center', justifyContent: 'center', opacity: 0.8 },
  kpiIconGreen: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#14532d', alignItems: 'center', justifyContent: 'center', opacity: 0.9 },
  kpiTextWrap: { flex: 1 },
  kpiLabel: { color: '#94a3b8', fontSize: 9, fontWeight: '600' },
  kpiValue: { color: '#f8fafc', fontSize: 12, fontWeight: '800', marginTop: 3 },
  kpiValueGreen: { color: '#4ade80', fontSize: 11, fontWeight: '800', marginTop: 3 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 14, paddingHorizontal: 12, gap: 8 },
  searchInput: { flex: 1, color: '#f8fafc', fontSize: 12, paddingVertical: 10 },
  filterGroup: { backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 12 },
  filterHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  filterHeader: { color: '#cbd5e1', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  filterCounter: { color: '#94a3b8', fontSize: 9 },
  horizontalRow: { paddingBottom: 4, gap: 6 },
  chip: { backgroundColor: '#020817', borderColor: '#334155', borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#3b82f6' },
  chipText: { color: '#cbd5e1', fontSize: 10, fontWeight: '700' },
  chipTextActive: { color: '#ffffff' },
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  statusChip: { paddingVertical: 5, paddingHorizontal: 8, borderRadius: 8, backgroundColor: '#020817', borderWidth: 1, borderColor: '#334155' },
  statusChipActive: { backgroundColor: '#0f172a', borderColor: '#60a5fa' },
  statusChipText: { color: '#94a3b8', fontSize: 9, fontWeight: '600' },
  statusChipTextActive: { color: '#93c5fd' },
  cardList: { gap: 12 },
  card: { backgroundColor: '#0f172a', borderRadius: 20, borderWidth: 1, borderColor: '#1e293b', padding: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  code: { backgroundColor: '#020817', color: '#cbd5e1', fontFamily: 'monospace', fontSize: 9, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1, borderColor: '#334155' },
  statusPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, fontSize: 9, fontWeight: '700', overflow: 'hidden' },
  statusOpen: { backgroundColor: 'rgba(34,197,94,0.12)', color: '#4ade80', borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)' },
  statusReview: { backgroundColor: 'rgba(251,191,36,0.12)', color: '#fbbf24', borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)' },
  cardTitle: { color: '#f8fafc', fontSize: 15, fontWeight: '800', marginBottom: 8 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  cardMetaText: { color: '#93c5fd', fontSize: 11, flexShrink: 1 },
  cardInfoGrid: { flexDirection: 'row', gap: 10 },
  cardInfoBox: { flex: 1, backgroundColor: '#020817', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b' },
  infoLabel: { color: '#94a3b8', fontSize: 9, marginBottom: 4 },
  infoValue: { color: '#f8fafc', fontSize: 11, fontWeight: '700' },
  infoValueGreen: { color: '#4ade80', fontSize: 11, fontWeight: '800' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  footerLeft: { color: '#cbd5e1', fontSize: 10 },
  footerLink: { color: '#60a5fa', fontSize: 10, fontWeight: '700' },
  emptyState: { backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 20, alignItems: 'center' },
  emptyTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '800', marginBottom: 8 },
  emptyText: { color: '#94a3b8', textAlign: 'center', fontSize: 12 },
  panel: { backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 14, gap: 12 },
  panelHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  panelTitle: { color: '#f8fafc', fontSize: 12, fontWeight: '800' },
  panelMeta: { color: '#94a3b8', fontSize: 9, fontFamily: 'monospace' },
  metricsGrid: { flexDirection: 'row', gap: 10 },
  metricBox: { flex: 1, backgroundColor: '#020817', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 10 },
  metricLabel: { color: '#94a3b8', fontSize: 9, marginBottom: 5 },
  metricBigGreen: { color: '#4ade80', fontSize: 18, fontWeight: '900' },
  metricBigBlue: { color: '#60a5fa', fontSize: 18, fontWeight: '900' },
  metricTrend: { color: '#cbd5e1', fontSize: 9, marginTop: 6 },
  barGroup: { gap: 10 },
  barRow: { gap: 4 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabel: { color: '#cbd5e1', fontSize: 10 },
  barValue: { fontSize: 10, fontWeight: '800' },
  barTrack: { height: 8, backgroundColor: '#1e293b', borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: '#f8fafc', fontSize: 13, fontWeight: '800' },
  metaText: { color: '#94a3b8', fontSize: 10 },
  applicationCard: { backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 12, gap: 8 },
  appHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appId: { color: '#cbd5e1', fontFamily: 'monospace', fontSize: 9, backgroundColor: '#020817', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 },
  appStatus: { color: '#4ade80', fontSize: 9, fontWeight: '700', backgroundColor: 'rgba(34,197,94,0.08)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  appTitle: { color: '#f8fafc', fontSize: 13, fontWeight: '800' },
  appEntity: { color: '#93c5fd', fontSize: 10 },
  appHashBox: { backgroundColor: '#020817', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 10, gap: 3 },
  hashLabel: { color: '#94a3b8', fontSize: 9 },
  hashValue: { color: '#4ade80', fontSize: 12, fontWeight: '800' },
  hashValueSmall: { color: '#cbd5e1', fontSize: 8, fontFamily: 'monospace' },
  profileCard: { backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 16, alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#1d4ed8', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarText: { color: '#ffffff', fontSize: 22, fontWeight: '900' },
  profileName: { color: '#f8fafc', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  profileRif: { color: '#94a3b8', fontSize: 10, marginTop: 4, marginBottom: 10, fontFamily: 'monospace' },
  rncBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(34,197,94,0.12)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)' },
  rncBadgeText: { color: '#4ade80', fontSize: 11, fontWeight: '700' },
  profilePanel: { backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 14, gap: 8 },
  profilePanelTitle: { color: '#f8fafc', fontSize: 12, fontWeight: '800', marginBottom: 6 },
  rowInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  rowLabel: { color: '#94a3b8', fontSize: 10, flexShrink: 1 },
  rowValue: { color: '#f8fafc', fontSize: 10, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  rowValueGreen: { color: '#4ade80', fontSize: 10, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  detailContent: { padding: 14, paddingBottom: 20, backgroundColor: '#020817' },
  detailCard: { backgroundColor: '#0f172a', borderRadius: 22, borderWidth: 1, borderColor: '#1e293b', padding: 14, gap: 12 },
  detailTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '800' },
  detailOrg: { color: '#93c5fd', fontSize: 12 },
  detailGrid: { flexDirection: 'row', gap: 10 },
  detailBox: { flex: 1, backgroundColor: '#020817', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 10 },
  paragraph: { color: '#cbd5e1', fontSize: 12, lineHeight: 22 },
  requirementRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  requirementText: { color: '#e2e8f0', fontSize: 12, flexShrink: 1, lineHeight: 20 },
  attachmentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#020817', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 10, marginBottom: 8 },
  attachmentText: { color: '#f8fafc', fontSize: 11, flex: 1 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  backText: { color: '#dfe7f2', fontSize: 12, fontWeight: '700' },
  uploadBox: { backgroundColor: '#020817', borderStyle: 'dashed', borderWidth: 1, borderColor: '#60a5fa', borderRadius: 16, padding: 18, alignItems: 'center', justifyContent: 'center', gap: 8 },
  uploadText: { color: '#f8fafc', fontSize: 12, textAlign: 'center' },
  uploadProgress: { color: '#60a5fa', fontSize: 10, fontWeight: '700' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#0f172a', borderTopWidth: 1, borderTopColor: '#1e293b', paddingVertical: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 4 },
  navText: { color: '#94a3b8', fontSize: 9, fontWeight: '600' },
  navTextActive: { color: '#60a5fa' },
  webStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#020817',
    padding: 24,
  },
  webPanel: {
    width: '100%',
    maxWidth: 1200,
    height: '100%',
    maxHeight: 920,
    backgroundColor: '#020817',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  webHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingHorizontal: 22,
    paddingVertical: 18,
  },
  webHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  webHeaderChip: {
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  webHeaderChipText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '700',
  },
  webWorkspace: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#020817',
  },
  webSidebar: {
    width: 260,
    backgroundColor: '#0b1220',
    borderRightWidth: 1,
    borderRightColor: '#1e293b',
    padding: 16,
    gap: 12,
  },
  webSidebarCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
  },
  webSidebarLabel: {
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    fontWeight: '700',
  },
  webSidebarValue: {
    fontSize: 30,
    color: '#f8fafc',
    fontWeight: '800',
  },
  webSidebarValueSmall: {
    fontSize: 14,
    color: '#4ade80',
    fontWeight: '700',
  },
  webSidebarMeta: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 6,
  },
  webMenuItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 8,
    backgroundColor: '#020817',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  webMenuItemActive: {
    backgroundColor: '#111827',
    borderColor: '#3b82f6',
  },
  webMenuText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
  },
  webMenuTextActive: {
    color: '#60a5fa',
  },
  webContentPane: {
    flex: 1,
    backgroundColor: '#020817',
  },
  webToolbar: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  webQuickFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  webOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
    backgroundColor: '#020817',
  },
  webOverviewEyebrow: {
    color: '#60a5fa',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  webOverviewTitle: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '800',
  },
  webPrimaryAction: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#2563eb',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
  },
  webPrimaryActionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  webStatsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 10,
    backgroundColor: '#020817',
  },
  webStatCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
  },
  webStatLabel: {
    color: '#94a3b8',
    fontSize: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  webStatValue: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '800',
  },
  webStatValueGreen: {
    color: '#4ade80',
    fontSize: 18,
    fontWeight: '800',
  },
});
