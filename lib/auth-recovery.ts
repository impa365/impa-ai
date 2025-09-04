/**
 * Sistema de Recuperação de Estados Corrompidos de Autenticação
 * Resolve automaticamente problemas que causam carregamento infinito
 */

interface RecoveryLog {
  timestamp: string;
  action: string;
  reason: string;
  success: boolean;
}

class AuthRecoverySystem {
  private static readonly RECOVERY_KEY = 'impaai_recovery_log';
  private static readonly MAX_RECOVERY_ATTEMPTS = 3;
  private static readonly RECOVERY_COOLDOWN = 5 * 60 * 1000; // 5 minutos

  /**
   * Verifica se o sistema precisa de recuperação
   */
  static needsRecovery(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      // Verificar se já tentou recuperação recentemente
      const recoveryLog = this.getRecoveryLog();
      const recentAttempts = recoveryLog.filter(
        log => Date.now() - new Date(log.timestamp).getTime() < this.RECOVERY_COOLDOWN
      );

      if (recentAttempts.length >= this.MAX_RECOVERY_ATTEMPTS) {
        console.warn('🚨 Muitas tentativas de recuperação recentes. Aguarde antes de tentar novamente.');
        return false;
      }

      // Verificar sinais de corrupção
      const hasCorruptedData = this.detectCorruption();
      const hasInfiniteLoading = this.detectInfiniteLoading();

      return hasCorruptedData || hasInfiniteLoading;
    } catch (error) {
      console.error('❌ Erro ao verificar necessidade de recuperação:', error);
      return true; // Em caso de erro, assumir que precisa de recuperação
    }
  }

  /**
   * Detecta dados corrompidos
   */
  private static detectCorruption(): boolean {
    try {
      // Verificar localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        JSON.parse(userStr); // Vai lançar erro se JSON inválido
      }

      // Verificar cookies
      const cookies = document.cookie.split(';');
      const userCookie = cookies.find(cookie => 
        cookie.trim().startsWith('impaai_user_client=')
      );

      if (userCookie) {
        const cookieValue = userCookie.split('=')[1];
        if (cookieValue) {
          JSON.parse(decodeURIComponent(cookieValue));
        }
      }

      return false;
    } catch (error) {
      console.warn('🔍 Dados corrompidos detectados:', error);
      return true;
    }
  }

  /**
   * Detecta carregamento infinito
   */
  private static detectInfiniteLoading(): boolean {
    // Verificar se a página está carregando há muito tempo
    const loadStartTime = sessionStorage.getItem('impaai_load_start');
    if (loadStartTime) {
      const elapsed = Date.now() - parseInt(loadStartTime);
      if (elapsed > 10000) { // 10 segundos
        console.warn('🕐 Carregamento infinito detectado');
        return true;
      }
    } else {
      // Marcar início do carregamento
      sessionStorage.setItem('impaai_load_start', Date.now().toString());
    }

    return false;
  }

  /**
   * Executa recuperação automática
   */
  static async performRecovery(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      console.log('🔧 Iniciando recuperação automática...');
      
      const actions: Array<() => Promise<void>> = [
        () => this.clearCorruptedData(),
        () => this.resetAuthState(),
        () => this.clearCache(),
        () => this.validateConnectivity()
      ];

      let success = true;
      const results: RecoveryLog[] = [];

      for (const action of actions) {
        try {
          await action();
          results.push({
            timestamp: new Date().toISOString(),
            action: action.name,
            reason: 'Executado com sucesso',
            success: true
          });
        } catch (error: any) {
          console.error(`❌ Falha na ação ${action.name}:`, error);
          results.push({
            timestamp: new Date().toISOString(),
            action: action.name,
            reason: error.message || 'Erro desconhecido',
            success: false
          });
          success = false;
        }
      }

      // Salvar log de recuperação
      this.saveRecoveryLog(results);

      if (success) {
        console.log('✅ Recuperação concluída com sucesso');
        sessionStorage.removeItem('impaai_load_start');
        
        // Recarregar página após recuperação
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        console.error('❌ Recuperação falhou parcialmente');
      }

      return success;
    } catch (error: any) {
      console.error('💥 Erro crítico na recuperação:', error);
      return false;
    }
  }

  /**
   * Limpa dados corrompidos
   */
  private static async clearCorruptedData(): Promise<void> {
    console.log('🧹 Limpando dados corrompidos...');

    // Limpar localStorage
    const keysToCheck = ['user', 'config', 'system_settings'];
    keysToCheck.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          JSON.parse(value); // Testa se é JSON válido
        }
      } catch (error) {
        console.log(`🗑️ Removendo ${key} corrompido do localStorage`);
        localStorage.removeItem(key);
      }
    });

    // Limpar cookies corrompidos
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const [name, value] = cookie.split('=');
      if (name && name.trim().startsWith('impaai_') && value) {
        try {
          if (name.includes('user_client')) {
            JSON.parse(decodeURIComponent(value));
          }
        } catch (error) {
          console.log(`🗑️ Removendo cookie corrompido: ${name.trim()}`);
          document.cookie = `${name.trim()}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
      }
    });
  }

  /**
   * Reseta estado de autenticação
   */
  private static async resetAuthState(): Promise<void> {
    console.log('🔄 Resetando estado de autenticação...');

    // Limpar todos os dados de autenticação
    localStorage.removeItem('user');
    sessionStorage.clear();
    
    // Limpar cookies de autenticação
    const authCookies = [
      'impaai_user_client',
      'impaai_access_token', 
      'impaai_refresh_token',
      'impaai_user'
    ];

    authCookies.forEach(cookieName => {
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });
  }

  /**
   * Limpa cache do navegador
   */
  private static async clearCache(): Promise<void> {
    console.log('🗑️ Limpando cache...');

    // Limpar cache de configurações
    localStorage.removeItem('config_cache');
    localStorage.removeItem('system_settings_cache');
    
    // Limpar sessionStorage
    const sessionKeys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('impaai_')) {
        sessionKeys.push(key);
      }
    }
    
    sessionKeys.forEach(key => sessionStorage.removeItem(key));
  }

  /**
   * Valida conectividade
   */
  private static async validateConnectivity(): Promise<void> {
    console.log('🌐 Validando conectividade...');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/system/version', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      console.log('✅ Conectividade validada');
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Timeout na validação de conectividade');
      }
      throw new Error(`Falha na conectividade: ${error.message}`);
    }
  }

  /**
   * Obtém log de recuperação
   */
  private static getRecoveryLog(): RecoveryLog[] {
    try {
      const log = localStorage.getItem(this.RECOVERY_KEY);
      return log ? JSON.parse(log) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Salva log de recuperação
   */
  private static saveRecoveryLog(newEntries: RecoveryLog[]): void {
    try {
      const existingLog = this.getRecoveryLog();
      const combinedLog = [...existingLog, ...newEntries];
      
      // Manter apenas últimas 50 entradas
      const trimmedLog = combinedLog.slice(-50);
      
      localStorage.setItem(this.RECOVERY_KEY, JSON.stringify(trimmedLog));
    } catch (error) {
      console.error('❌ Erro ao salvar log de recuperação:', error);
    }
  }

  /**
   * Força limpeza completa (botão de emergência)
   */
  static emergencyCleanup(): void {
    console.log('🚨 LIMPEZA DE EMERGÊNCIA INICIADA');
    
    try {
      // Limpar TUDO
      localStorage.clear();
      sessionStorage.clear();
      
      // Limpar todos os cookies do domínio
      document.cookie.split(';').forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      });

      console.log('✅ Limpeza de emergência concluída');
      
      // Recarregar página
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
      
    } catch (error) {
      console.error('❌ Erro na limpeza de emergência:', error);
      // Forçar reload mesmo com erro
      window.location.reload();
    }
  }

  /**
   * Verifica se deve mostrar botão de emergência
   */
  static shouldShowEmergencyButton(): boolean {
    const recoveryLog = this.getRecoveryLog();
    const recentFailures = recoveryLog.filter(
      log => !log.success && 
      Date.now() - new Date(log.timestamp).getTime() < this.RECOVERY_COOLDOWN
    );

    return recentFailures.length >= 2;
  }
}

export default AuthRecoverySystem; 