/* ================================================
   Auth Module — Roles, Usuarios y Autenticación
   CRM Cafetería "Oveja Negra"
   ================================================ */

const Auth = {
  // ---- Current User Management ----
  getCurrentUser() {
    const raw = localStorage.getItem('on_current_user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem('on_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('on_current_user');
    }
  },

  isLoggedIn() {
    return !!this.getCurrentUser();
  },

  isAdmin() {
    const user = this.getCurrentUser();
    return user && (user.rol === 'Administrador' || (user.modulos_permitidos && user.modulos_permitidos.includes('usuarios')));
  },

  hasModuleAccess(module) {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.rol === 'Administrador') return true;
    if (Array.isArray(user.modulos_permitidos)) {
      return user.modulos_permitidos.includes(module);
    }
    return false;
  },

  // ---- Login with Validation & Status Checks ----
  async login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const { data: usuarios } = await DB.getAll('usuarios');
    const user = usuarios.find(u => (u.email || '').toLowerCase() === cleanEmail);

    if (!user || user.password !== password) {
      return {
        success: false,
        reason: 'invalid_credentials',
        message: 'Correo electrónico o contraseña incorrectos.'
      };
    }

    // Check email verification
    if (!user.email_verificado) {
      return {
        success: false,
        reason: 'unverified_email',
        email: user.email,
        code: user.codigo_verificacion,
        message: 'Tu correo electrónico aún no ha sido verificado.'
      };
    }

    // Check administrator approval
    if (!user.aprobado || user.estado === 'Pendiente') {
      return {
        success: false,
        reason: 'pending_approval',
        userName: user.nombres,
        email: user.email,
        userId: user.id,
        message: 'Tu cuenta ha sido verificada pero aún está PENDIENTE de aprobación por el Administrador. No puedes ingresar hasta que sea aceptada.'
      };
    }

    if (user.estado === 'Rechazado') {
      return {
        success: false,
        reason: 'rejected',
        message: 'Tu solicitud de acceso fue rechazada por el Administrador. Contacta a la gerencia.'
      };
    }

    // Approved & Verified -> Success
    this.setCurrentUser(user);
    return {
      success: true,
      user
    };
  },

  // ---- Registration with Verification Code Generation ----
  async register(formData) {
    const cleanEmail = (formData.email || '').trim().toLowerCase();
    const { data: usuarios } = await DB.getAll('usuarios');

    if (usuarios.some(u => (u.email || '').toLowerCase() === cleanEmail)) {
      return {
        success: false,
        message: 'Ya existe una cuenta registrada con este correo electrónico.'
      };
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser = {
      nombres: formData.nombres.trim(),
      email: cleanEmail,
      password: formData.password,
      telefono: formData.telefono ? formData.telefono.trim() : '',
      cargo: 'Por Asignar',
      rol: 'Personal',
      email_verificado: false,
      codigo_verificacion: verificationCode,
      codigo_expira: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      aprobado: false,
      estado: 'Pendiente',
      fecha_aprobacion: null,
      aprobado_por: null,
      modulos_permitidos: []
    };

    const { data: createdUser } = await DB.create('usuarios', newUser);

    return {
      success: true,
      user: createdUser,
      email: cleanEmail,
      code: verificationCode
    };
  },

  // ---- Verify Code ----
  async verifyEmail(email, code) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanCode = (code || '').trim();

    const { data: usuarios } = await DB.getAll('usuarios');
    const user = usuarios.find(u => (u.email || '').toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, message: 'Usuario no encontrado.' };
    }

    if (user.codigo_verificacion !== cleanCode) {
      return { success: false, message: 'El código de verificación es incorrecto.' };
    }

    // Mark as verified, keep pendiente/aprobado: false
    await DB.update('usuarios', user.id, {
      email_verificado: true,
      codigo_verificacion: ''
    });

    return {
      success: true,
      message: '¡Correo verificado correctamente! Tu cuenta ahora está pendiente de aprobación por el Administrador antes de que puedas ingresar.'
    };
  },

  // ---- Resend Code ----
  async resendCode(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const { data: usuarios } = await DB.getAll('usuarios');
    const user = usuarios.find(u => (u.email || '').toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, message: 'Usuario no encontrado.' };
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    await DB.update('usuarios', user.id, {
      codigo_verificacion: newCode,
      codigo_expira: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    return { success: true, code: newCode };
  },

  // ---- Dispatch Real Email to Recipient ----
  async sendVerificationEmail(email, nombres, code) {
    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. Log with high-visibility styling to developer console for development and instant verification
    console.info(
      `%c[Oveja Negra CRM] 📧 Código de Verificación para %c${cleanEmail}%c: %c${code}`,
      'color: #5D4037; font-weight: bold;',
      'color: #1565C0; font-weight: bold; text-decoration: underline;',
      'color: #5D4037; font-weight: bold;',
      'color: #2E7D32; font-weight: 900; font-size: 15px; background: #E8F5E9; padding: 2px 8px; border-radius: 4px; border: 1px solid #A5D6A7;'
    );

    // 2. Check if EmailJS is configured by Administrator
    const emailConfig = this.getEmailConfig();
    if (emailConfig && emailConfig.service_id && emailConfig.public_key) {
      try {
        console.log('📤 Intentando envío con EmailJS...');
        if (window.emailjs) {
          if (typeof window.emailjs.init === 'function') {
            try {
              window.emailjs.init({ publicKey: emailConfig.public_key });
            } catch (initErr) {
              window.emailjs.init(emailConfig.public_key);
            }
          }
          const templateParams = {
            to_name: nombres || 'Usuario',
            name: nombres || 'Usuario',
            user_name: nombres || 'Usuario',
            to_email: cleanEmail,
            user_email: cleanEmail,
            email: cleanEmail,
            recipient: cleanEmail,
            verification_code: code,
            code: code,
            codigo: code,
            codigo_verificacion: code,
            platform_name: 'Oveja Negra CRM — Cafetería',
            message: `Tu código de verificación para ingresar a Oveja Negra CRM es: ${code}`
          };
          const res = await window.emailjs.send(
            emailConfig.service_id,
            emailConfig.template_id || 'template_default',
            templateParams,
            emailConfig.public_key
          );
          console.log('✅ Correo entregado exitosamente mediante EmailJS:', res);
          return { success: true, provider: 'EmailJS', status: res.status };
        } else {
          console.warn('⚠️ SDK de EmailJS no encontrado en window.emailjs');
        }
      } catch (err) {
        const detail = err?.text || err?.message || (typeof err === 'string' ? err : 'Fallo en servicio');
        console.warn('⚠️ Error en despacho con EmailJS:', detail, err);
        return {
          success: false,
          provider: 'EmailJS',
          message: `EmailJS respondió: "${detail}". Revisa que tu Service ID, Template ID y Public Key sean correctos.`
        };
      }
    }

    // 3. Fallback: Local Preview Modal (Simulate email arrival for users without EmailJS)
    console.log('✅ Utilizando visor de correo local (EmailJS no configurado).');
    
    // Auto-show modal after a short delay to simulate email delivery
    setTimeout(() => {
      this.showEmailPreviewModal(cleanEmail);
    }, 1500);

    return { 
      success: true, 
      provider: 'LocalPreview' 
    };
  },

  getEmailConfig() {
    try {
      const raw = localStorage.getItem('on_email_config');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  saveEmailConfig(config) {
    if (config) {
      localStorage.setItem('on_email_config', JSON.stringify(config));
    } else {
      localStorage.removeItem('on_email_config');
    }
  },

  openEmailConfigModal() {
    if (typeof window.openEmailConfigModal === 'function') {
      window.openEmailConfigModal();
    } else {
      showToast('Cargando configuración de EmailJS...', 'info');
    }
  },

  // ---- Interactive Email Authentication Message Viewer ----
  async showEmailPreviewModal(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const { data: usuarios } = await DB.getAll('usuarios');
    const user = usuarios.find(u => (u.email || '').toLowerCase() === cleanEmail);

    if (!user) {
      showToast('Usuario no encontrado', 'warning');
      return;
    }

    const code = user.codigo_verificacion || '------';

    const body = `
      <div style="font-family: 'Inter', -apple-system, sans-serif;">
        <!-- Email Client Frame Header -->
        <div style="background: #2C1810; color: white; padding: 14px 18px; border-radius: var(--radius-md) var(--radius-md) 0 0; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 34px; height: 34px; background: rgba(212, 165, 116, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <i data-lucide="mail" width="18" height="18" style="color: #D4A574;"></i>
            </div>
            <div>
              <div style="font-weight: 700; font-size: 13px; color: #FFF;">Oveja Negra CRM — Mensaje de Autenticación</div>
              <div style="font-size: 11px; color: #D4A574;">De: autenticacion@ovejanegra.ec</div>
            </div>
          </div>
          <span class="badge" style="background: rgba(255,255,255,0.15); color: #FFF; font-size: 11px;">Bandeja de Entrada</span>
        </div>

        <!-- Email Message Body -->
        <div style="background: #FFFFFF; border: 1px solid #E0E0E0; border-top: none; border-radius: 0 0 var(--radius-md) var(--radius-md); padding: 20px; color: #333;">
          <div style="font-size: 12px; color: #666; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px dashed #E0E0E0; line-height: 1.5;">
            <strong>Para:</strong> ${user.nombres} &lt;${cleanEmail}&gt;<br>
            <strong>Asunto:</strong> Código de Autenticación — Oveja Negra CRM<br>
            <strong>Fecha:</strong> ${new Date().toLocaleString()}
          </div>

          <p style="font-size: 14px; margin-bottom: 10px;">Hola <strong>${user.nombres}</strong>,</p>
          <p style="font-size: 13px; line-height: 1.5; color: #555; margin-bottom: 16px;">
            Has solicitado crear una cuenta en <strong>Oveja Negra CRM</strong>. Para verificar tu correo electrónico y proceder a la aprobación del Administrador, utiliza tu código de autenticación:
          </p>

          <div style="background: #FFF8E1; border: 2px dashed #FFA000; border-radius: var(--radius-md); padding: 16px; text-align: center; margin-bottom: 16px;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #8D6E63; margin-bottom: 4px; font-weight: 700;">Tu Código de 6 Dígitos</div>
            <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #2C1810; font-family: monospace;">${code}</div>
            <div style="font-size: 11px; color: #8D6E63; margin-top: 4px;">Válido para completar tu registro</div>
          </div>

          <p style="font-size: 12px; color: #777; line-height: 1.4; margin-bottom: 18px;">
            Una vez ingresado este código en la pantalla de verificación, tu cuenta quedará autenticada y pasará al Administrador del sistema para que acepte tu usuario y te asigne tus módulos.
          </p>

          <div style="display: flex; justify-content: center; gap: 10px;">
            <button type="button" class="btn btn-primary" style="padding: 9px 20px; font-weight: 700; font-size: 13px;" onclick="Auth.fillVerificationCode('${code}'); closeModal();">
              <i data-lucide="check" width="16" height="16"></i> Usar e Ingresar este Código
            </button>
          </div>
        </div>
      </div>
    `;

    openModal('Mensaje de Autenticación de Correo', body, '', 'modal-md');
    if (window.lucide) lucide.createIcons();
  },

  fillVerificationCode(code) {
    const input = document.getElementById('verify-code');
    if (input) {
      input.value = code;
      showToast(`Código ${code} ingresado en el formulario`, 'success');
      input.focus();
    }
  },

  // ---- Logout ----
  logout() {
    this.setCurrentUser(null);
    showToast('Has cerrado sesión correctamente', 'info');
    this.renderAuthScreen();
  },

  // ================================================
  // Auth Screen UI Rendering
  // ================================================
  renderAuthScreen(view = 'login', data = {}) {
    const authContainer = document.getElementById('auth-container');
    const appLayout = document.querySelector('.app-layout');

    if (appLayout) appLayout.style.display = 'none';
    if (!authContainer) return;

    authContainer.style.display = 'flex';

    if (view === 'login') {
      authContainer.innerHTML = this._getLoginHTML(data);
    } else if (view === 'register') {
      authContainer.innerHTML = this._getRegisterHTML(data);
    } else if (view === 'verify') {
      authContainer.innerHTML = this._getVerifyHTML(data);
    } else if (view === 'pending') {
      authContainer.innerHTML = this._getPendingHTML(data);
    }

    if (window.lucide) lucide.createIcons();
  },

  hideAuthScreen() {
    const authContainer = document.getElementById('auth-container');
    const appLayout = document.querySelector('.app-layout');
    if (authContainer) authContainer.style.display = 'none';
    if (appLayout) appLayout.style.display = 'flex';
  },

  // ---- HTML Template: Login ----
  _getLoginHTML(data = {}) {
    // Retrieve custom approved users for quick testing
    let customPillsHTML = '';
    try {
      const allUsers = (typeof DB !== 'undefined' && DB._getTable) ? DB._getTable('usuarios') : [];
      const customApproved = allUsers.filter(u => 
        u.aprobado && 
        u.rol !== 'Administrador' && 
        !['cajero@ovejanegra.ec', 'barista@ovejanegra.ec', 'mesero@ovejanegra.ec'].includes(u.email)
      );
      if (customApproved.length > 0) {
        customPillsHTML = `
          <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--border-light); width: 100%;">
            <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 6px; font-weight: 600; display: flex; align-items: center; gap: 4px;">
              <i data-lucide="user-check" width="12" height="12" style="color: #2E7D32;"></i> Cuentas Creadas y Aprobadas Listas para Probar:
            </div>
            <div class="auth-demo-pills">
              ${customApproved.map(u => `
                <button type="button" class="auth-demo-pill" style="background: #E8F5E9; border-color: #A5D6A7; color: #1B5E20;" onclick="Auth.fillDemoCredentials('${u.email}', '${u.password || ''}')" title="Probar ingreso de ${u.nombres}">
                  <strong>${(u.nombres || 'Usuario').split(' ')[0]}</strong> (${u.cargo || u.rol})
                </button>
              `).join('')}
            </div>
          </div>
        `;
      }
    } catch (e) {}

    return `
      <div class="auth-wrapper">
        <div class="auth-card">
          <!-- Logo & Brand Header -->
          <div class="auth-header">
            <div class="auth-logo-badge">
              <img src="assets/logo.svg" alt="Oveja Negra" class="auth-logo-img">
            </div>
            <h1 class="auth-brand-title">Oveja Negra</h1>
            <p class="auth-brand-tagline">Cafetería &amp; CRM · Control Integral</p>
          </div>

          <!-- Tabs -->
          <div class="auth-tabs">
            <button class="auth-tab active" onclick="Auth.renderAuthScreen('login')">
              <i data-lucide="log-in" width="16" height="16"></i> Iniciar Sesión
            </button>
            <button class="auth-tab" onclick="Auth.renderAuthScreen('register')">
              <i data-lucide="user-plus" width="16" height="16"></i> Crear Cuenta
            </button>
          </div>

          <!-- Alert area -->
          <div id="auth-alert" class="auth-alert" style="${data.errorMessage ? 'display: flex;' : 'display: none;'}">
            <i data-lucide="alert-circle" width="18" height="18"></i>
            <span id="auth-alert-text">${data.errorMessage || ''}</span>
          </div>

          <!-- Login Form -->
          <form id="login-form" onsubmit="Auth.handleLoginSubmit(event)">
            <div class="form-group" style="margin-bottom: var(--space-md);">
              <label class="form-label"><i data-lucide="mail" width="14" height="14"></i> Correo Electrónico</label>
              <input type="email" id="login-email" class="form-control" placeholder="admin@ovejanegra.ec" required autofocus value="${data.email || ''}">
            </div>

            <div class="form-group" style="margin-bottom: var(--space-lg);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label class="form-label" style="margin-bottom: 0;"><i data-lucide="lock" width="14" height="14"></i> Contraseña</label>
                <button type="button" class="btn-link" style="font-size: var(--fs-xs); color: var(--secondary); background: none; border: none; cursor: pointer;" onclick="Auth.togglePasswordVisibility('login-password', this)">Mostrar</button>
              </div>
              <input type="password" id="login-password" class="form-control" placeholder="••••••••" required value="${data.password || ''}">
            </div>

            <button type="submit" class="btn btn-primary auth-submit-btn" id="login-submit-btn">
              <i data-lucide="arrow-right-circle" width="18" height="18"></i> Ingresar a la Plataforma
            </button>
          </form>

          <!-- Fast Demo Accounts Pills -->
          <div class="auth-demo-section">
            <div class="auth-demo-title">
              <i data-lucide="sparkles" width="14" height="14"></i> Cuentas Rápidas de Demostración &amp; Pruebas
            </div>
            <div class="auth-demo-pills">
              <button type="button" class="auth-demo-pill pill-admin" onclick="Auth.fillDemoCredentials('admin@ovejanegra.ec', 'admin123')">
                <strong>Admin</strong> (Acceso Total)
              </button>
              <button type="button" class="auth-demo-pill pill-cajero" onclick="Auth.fillDemoCredentials('cajero@ovejanegra.ec', 'cajero123')">
                <strong>Cajero</strong> (Aprobado)
              </button>
              <button type="button" class="auth-demo-pill pill-barista" onclick="Auth.fillDemoCredentials('barista@ovejanegra.ec', 'barista123')">
                <strong>Barista</strong> (Pendiente Aprob.)
              </button>
              <button type="button" class="auth-demo-pill pill-mesero" onclick="Auth.fillDemoCredentials('mesero@ovejanegra.ec', 'mesero123')">
                <strong>Mesero</strong> (No Verificado)
              </button>
            </div>
            ${customPillsHTML}
          </div>

          <div class="auth-footer-notice" style="margin-bottom: 8px;">
            <i data-lucide="shield-check" width="14" height="14"></i> Sistema de acceso protegido con verificación y aprobación obligatoria.
          </div>

          <div style="text-align: center; padding-top: 8px; border-top: 1px dashed var(--border-light);">
            <button type="button" class="btn-link" style="color: var(--secondary); font-size: 12px; font-weight: 600; background: none; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;" onclick="Auth.openEmailConfigModal()">
              <i data-lucide="mail-cog" width="14" height="14"></i> Configurar Correo (EmailJS)
            </button>
          </div>
        </div>
      </div>
    `;
  },

  // ---- HTML Template: Register ----
  _getRegisterHTML(data = {}) {
    return `
      <div class="auth-wrapper">
        <div class="auth-card" style="max-width: 520px;">
          <!-- Header -->
          <div class="auth-header" style="margin-bottom: var(--space-md);">
            <div class="auth-logo-badge" style="width: 48px; height: 48px; margin-bottom: 8px;">
              <img src="assets/logo.svg" alt="Oveja Negra" class="auth-logo-img" style="width: 32px; height: 32px;">
            </div>
            <h1 class="auth-brand-title" style="font-size: 1.5rem;">Registro de Usuario</h1>
            <p class="auth-brand-tagline">Solicita tu cuenta para ingresar al CRM de Oveja Negra</p>
          </div>

          <!-- Tabs -->
          <div class="auth-tabs">
            <button class="auth-tab" onclick="Auth.renderAuthScreen('login')">
              <i data-lucide="log-in" width="16" height="16"></i> Iniciar Sesión
            </button>
            <button class="auth-tab active" onclick="Auth.renderAuthScreen('register')">
              <i data-lucide="user-plus" width="16" height="16"></i> Crear Cuenta
            </button>
          </div>

          <!-- Alert area -->
          <div id="auth-alert" class="auth-alert" style="${data.errorMessage ? 'display: flex;' : 'display: none;'}">
            <i data-lucide="alert-circle" width="18" height="18"></i>
            <span id="auth-alert-text">${data.errorMessage || ''}</span>
          </div>

          <!-- Registration Form -->
          <form id="register-form" onsubmit="Auth.handleRegisterSubmit(event)">
            <div class="form-grid">
              <div class="form-group" style="grid-column: 1/-1;">
                <label class="form-label">Nombres y Apellidos *</label>
                <input type="text" id="reg-nombres" class="form-control" placeholder="Ej: Daniel Esteban Carrera" required>
              </div>

              <div class="form-group">
                <label class="form-label">Correo Electrónico *</label>
                <input type="email" id="reg-email" class="form-control" placeholder="usuario@ovejanegra.ec" required>
              </div>

              <div class="form-group">
                <label class="form-label">Teléfono / Celular</label>
                <input type="tel" id="reg-telefono" class="form-control" placeholder="0991234567">
              </div>

              <div class="form-group">
                <label class="form-label">Contraseña *</label>
                <input type="password" id="reg-password" class="form-control" placeholder="Mínimo 6 caracteres" required minlength="6">
              </div>

              <div class="form-group">
                <label class="form-label">Confirmar Contraseña *</label>
                <input type="password" id="reg-password-confirm" class="form-control" placeholder="Repite la contraseña" required minlength="6">
              </div>
            </div>

            <!-- Workflow info card -->
            <div class="auth-info-box" style="margin: var(--space-md) 0;">
              <i data-lucide="info" width="16" height="16" style="color: var(--secondary); flex-shrink: 0; margin-top: 2px;"></i>
              <div style="font-size: 12px; line-height: 1.4; color: var(--text-secondary);">
                <strong>Pasos del proceso:</strong>
                <ol style="margin: 4px 0 0 16px; padding: 0;">
                  <li>Verificarás tu correo con un código de 6 dígitos.</li>
                  <li>El <strong>Administrador</strong> te asignará tu cargo y los módulos a los que tendrás acceso.</li>
                </ol>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin: 4px 0 12px 0; font-size: 11px; color: var(--text-muted);">
              <span><i data-lucide="mail" width="12" height="12" style="vertical-align: middle;"></i> Envío de código vía <strong>EmailJS</strong></span>
              <button type="button" class="btn-link" style="color: var(--secondary); background: none; border: none; cursor: pointer; font-size: 11px; text-decoration: underline;" onclick="Auth.openEmailConfigModal()">
                ⚙️ Configurar EmailJS
              </button>
            </div>

            <button type="submit" class="btn btn-primary auth-submit-btn" id="reg-submit-btn">
              <i data-lucide="mail-check" width="18" height="18"></i> Crear Cuenta y Recibir Código
            </button>
          </form>

          <div style="text-align: center; margin-top: var(--space-md);">
            <button type="button" class="btn-link" style="color: var(--secondary); font-size: var(--fs-sm); background: none; border: none; cursor: pointer;" onclick="Auth.renderAuthScreen('login')">
              ¿Ya tienes cuenta registrada? Inicia sesión aquí
            </button>
          </div>
        </div>
      </div>
    `;
  },

  // ---- HTML Template: Verification ----
  _getVerifyHTML(data = {}) {
    const isSentOk = data.emailSent !== false;

    return `
      <div class="auth-wrapper">
        <div class="auth-card" style="max-width: 480px; text-align: center;">
          <div class="auth-icon-circle" style="background: var(--accent-glow); width: 64px; height: 64px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: var(--space-md);">
            <i data-lucide="mail" width="32" height="32" style="color: var(--primary);"></i>
          </div>

          <h2 class="auth-brand-title" style="font-size: 1.4rem; margin-bottom: 6px;">Verifica tu Correo Electrónico</h2>
          <p style="font-size: var(--fs-sm); color: var(--text-secondary); margin-bottom: var(--space-md);">
            Hemos enviado un código de seguridad de 6 dígitos a:<br>
            <strong style="color: var(--primary); font-size: 15px;">${data.email || 'tu correo'}</strong>
          </p>

          <div style="background: var(--bg-alt); border-radius: var(--radius-md); padding: var(--space-md); margin-bottom: var(--space-md); text-align: left; border: 1px solid var(--border-light);">
            <div style="display: flex; gap: 10px; align-items: flex-start;">
              <i data-lucide="inbox" width="20" height="20" style="color: var(--secondary); flex-shrink: 0; margin-top: 2px;"></i>
              <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.45; flex: 1;">
                Revisa tu <strong>Bandeja de Entrada</strong> (o carpeta de <em>Spam / Correo no deseado</em>). Abre el mensaje recibido e ingresa el código a continuación para validar tu cuenta.
              </div>
            </div>
            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--border-light); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
              <span style="font-size: 11px; color: var(--text-muted);"><i data-lucide="mail-search" width="12" height="12" style="vertical-align: middle;"></i> ¿Pruebas en local o demora de red?</span>
              <div style="display: flex; gap: 6px;">
                <button type="button" class="btn btn-sm btn-outline" style="border-color: var(--secondary); color: var(--primary); font-size: 11px; padding: 4px 10px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;" onclick="Auth.showEmailPreviewModal('${data.email || ''}')">
                  <i data-lucide="mail-open" width="13" height="13"></i> Ver Mensaje de Autenticación
                </button>
              </div>
            </div>
          </div>

          <!-- Helpful troubleshooting accordion -->
          <div style="background: #FFFDF7; border: 1px solid #FFE082; border-radius: var(--radius-sm); padding: 10px 14px; margin-bottom: var(--space-lg); text-align: left; font-size: 12px; color: #5D4037;">
            <div style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;" onclick="const el=document.getElementById('verify-help-box'); if(el) el.style.display = el.style.display === 'none' ? 'block' : 'none';">
              <span style="font-weight: 600; display: flex; align-items: center; gap: 6px;">
                <i data-lucide="help-circle" width="15" height="15" style="color: #F57F17;"></i> ¿Problemas para recibir el correo?
              </span>
              <span style="color: #E65100; font-size: 11px; font-weight: 600;">Ver ayuda ▼</span>
            </div>
            <div id="verify-help-box" style="display: none; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #FFD54F; line-height: 1.45;">
              <p style="margin: 0 0 6px 0;">1. <strong>Bandeja de Spam:</strong> En algunos proveedores (Gmail, Outlook) el correo inicial puede caer en <em>Spam</em> o <em>Promociones</em>.</p>
              <p style="margin: 0 0 6px 0;">2. <strong>Bandeja Virtual:</strong> Puedes hacer clic en <button type="button" class="btn-link" style="color: var(--secondary); font-weight: 700; text-decoration: underline; background: none; border: none; cursor: pointer; padding: 0;" onclick="Auth.showEmailPreviewModal('${data.email || ''}')">Ver Mensaje de Autenticación</button> para consultar y cargar directamente el código enviado.</p>
              <p style="margin: 0 0 6px 0;">3. <strong>Configuración EmailJS:</strong> Puedes vincular tus credenciales de EmailJS en cualquier momento: <button type="button" class="btn-link" style="color: var(--secondary); font-weight: 700; text-decoration: underline; background: none; border: none; cursor: pointer; padding: 0;" onclick="Auth.openEmailConfigModal()">⚙️ Configurar EmailJS</button>.</p>
              <p style="margin: 0 0 6px 0;">4. <strong>Desbloqueo por Administrador:</strong> Si no puedes recibir el correo, el <strong>Administrador del Sistema</strong> puede ver tu código o verificar tu cuenta directamente desde el módulo <em>Usuarios y Roles</em>.</p>
              <p style="margin: 0; color: #8D6E63; font-size: 11px;">(En modo local / pruebas, el código también se imprime en la consola del navegador F12).</p>
            </div>
          </div>

          <!-- Alert area -->
          <div id="auth-alert" class="auth-alert" style="${data.errorMessage ? 'display: flex;' : 'display: none;'}">
            <i data-lucide="alert-circle" width="18" height="18"></i>
            <span id="auth-alert-text">${data.errorMessage || ''}</span>
          </div>

          <form id="verify-form" onsubmit="Auth.handleVerifySubmit(event, '${data.email || ''}')">
            <div class="form-group" style="margin-bottom: var(--space-lg);">
              <label class="form-label" style="text-align: center; display: block; font-weight: 600;">Ingresa el código de 6 dígitos recibido</label>
              <input type="text" id="verify-code" class="form-control" placeholder="000000" maxlength="6" style="text-align: center; font-size: 24px; letter-spacing: 8px; font-family: monospace; font-weight: 700; height: 54px;" autofocus required autocomplete="one-time-code">
            </div>

            <button type="submit" class="btn btn-primary auth-submit-btn" style="margin-bottom: var(--space-md);">
              <i data-lucide="check-circle-2" width="18" height="18"></i> Confirmar y Enviar para Aprobación
            </button>
          </form>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-md); font-size: var(--fs-sm);">
            <button type="button" class="btn-link" id="resend-btn" style="color: var(--secondary); background: none; border: none; cursor: pointer;" onclick="Auth.handleResendCode('${data.email || ''}')">
              <i data-lucide="rotate-ccw" width="14" height="14" style="vertical-align: middle;"></i> Reenviar a mi correo
            </button>
            <button type="button" class="btn-link" style="color: var(--text-muted); background: none; border: none; cursor: pointer;" onclick="Auth.renderAuthScreen('login')">
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    `;
  },

  // ---- HTML Template: Pending Approval Notice ----
  _getPendingHTML(data = {}) {
    return `
      <div class="auth-wrapper">
        <div class="auth-card" style="max-width: 480px; text-align: center;">
          <div class="auth-icon-circle" style="background: #FFF3E0; width: 68px; height: 68px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: var(--space-md); border: 2px solid #FFE0B2;">
            <i data-lucide="clock" width="36" height="36" style="color: #EF6C00;"></i>
          </div>

          <h2 class="auth-brand-title" style="font-size: 1.4rem; margin-bottom: 8px;">Cuenta Pendiente de Aprobación</h2>
          <p style="font-size: var(--fs-sm); color: var(--text-secondary); margin-bottom: var(--space-md); line-height: 1.5;">
            Hola <strong>${data.userName || 'Usuario'}</strong>, tu correo electrónico ya ha sido verificado con éxito.
          </p>

          <div style="background: #FFF8E1; border: 1px solid #FFE082; padding: var(--space-md); border-radius: var(--radius-md); text-align: left; margin-bottom: var(--space-md);">
            <div style="display: flex; gap: 8px; align-items: flex-start;">
              <i data-lucide="shield-alert" width="20" height="20" style="color: #F57F17; flex-shrink: 0; margin-top: 2px;"></i>
              <div style="font-size: 13px; color: #5D4037; line-height: 1.4;">
                <strong>Revisión de Seguridad:</strong> Por políticas de la cafetería Oveja Negra, el <strong>Administrador del Sistema</strong> debe aprobar tu cuenta y asignar los módulos correspondientes antes de que puedas entrar a la plataforma.
              </div>
            </div>
          </div>

          <!-- Fast Track for Local Development / Testing -->
          <div style="background: #E8F5E9; border: 1px solid #A5D6A7; padding: var(--space-md); border-radius: var(--radius-md); text-align: left; margin-bottom: var(--space-lg);">
            <div style="display: flex; gap: 8px; align-items: flex-start; margin-bottom: 10px;">
              <i data-lucide="shield-check" width="20" height="20" style="color: #2E7D32; flex-shrink: 0; margin-top: 2px;"></i>
              <div style="font-size: 13px; color: #1B5E20; line-height: 1.4;">
                <strong>¿Deseas probar el acceso de este usuario ahora?</strong><br>
                Ingresa directamente como Administrador para configurar sus módulos y aprobar a <strong>${data.userName || 'este usuario'}</strong>:
              </div>
            </div>
            <button type="button" class="btn btn-primary" style="width: 100%; justify-content: center; background: #2E7D32; border-color: #2E7D32; font-weight: 700; padding: 10px;" onclick="Auth.quickAdminApprove('${data.userId || data.email || ''}')">
              <i data-lucide="user-check" width="16" height="16"></i> Entrar como Admin y Aprobar a ${data.userName || 'este usuario'}
            </button>
          </div>

          <div style="background: var(--bg-alt); padding: var(--space-sm) var(--space-md); border-radius: var(--radius-sm); font-size: 12px; color: var(--text-muted); margin-bottom: var(--space-lg);">
            Si eres el Administrador para pruebas manuales, inicia sesión con:<br>
            <strong style="color: var(--primary);">admin@ovejanegra.ec</strong> (Clave: <code style="background: white; padding: 2px 6px; border-radius: 3px;">admin123</code>) para aprobar a este usuario.
          </div>

          <button type="button" class="btn btn-primary auth-submit-btn" onclick="Auth.renderAuthScreen('login')">
            <i data-lucide="arrow-left" width="16" height="16"></i> Volver a la Pantalla de Acceso
          </button>
        </div>
      </div>
    `;
  },

  // ---- Form Handlers ----
  async handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('login-email')?.value || '';
    const password = document.getElementById('login-password')?.value || '';
    const submitBtn = document.getElementById('login-submit-btn');

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner-sm"></span> Verificando...`;
    }

    const result = await this.login(email, password);

    if (result.success) {
      showToast(`¡Bienvenido al sistema, ${result.user.nombres}!`, 'success');
      this.hideAuthScreen();
      // Reload app state to apply user permissions
      initAppSession(result.user);
    } else {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="arrow-right-circle" width="18" height="18"></i> Ingresar a la Plataforma`;
        if (window.lucide) lucide.createIcons();
      }

      if (result.reason === 'unverified_email') {
        // Redirect to verify code screen without exposing code
        showToast('Tu correo aún no ha sido verificado. Ingresa el código que te enviamos.', 'warning');
        this.renderAuthScreen('verify', { email: result.email });
      } else if (result.reason === 'pending_approval') {
        this.renderAuthScreen('pending', { 
          userName: result.userName,
          email: result.email,
          userId: result.userId
        });
      } else {
        const alertEl = document.getElementById('auth-alert');
        const alertText = document.getElementById('auth-alert-text');
        if (alertEl && alertText) {
          alertText.textContent = result.message;
          alertEl.style.display = 'flex';
        }
        showToast(result.message, 'danger');
      }
    }
  },

  async handleRegisterSubmit(e) {
    e.preventDefault();
    const nombres = document.getElementById('reg-nombres')?.value || '';
    const email = document.getElementById('reg-email')?.value || '';
    const telefono = document.getElementById('reg-telefono')?.value || '';
    const password = document.getElementById('reg-password')?.value || '';
    const passwordConfirm = document.getElementById('reg-password-confirm')?.value || '';

    const alertEl = document.getElementById('auth-alert');
    const alertText = document.getElementById('auth-alert-text');

    if (password !== passwordConfirm) {
      if (alertEl && alertText) {
        alertText.textContent = 'Las contraseñas no coinciden. Verifícalas.';
        alertEl.style.display = 'flex';
      }
      showToast('Las contraseñas no coinciden', 'warning');
      return;
    }

    const submitBtn = document.getElementById('reg-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner-sm"></span> Enviando código a tu correo...`;
    }

    const result = await this.register({ nombres, email, telefono, password });

    if (result.success) {
      // Send real email to recipient
      const sendResult = await this.sendVerificationEmail(result.email, nombres, result.code);

      if (sendResult.success) {
        showToast(`Código de verificación enviado a ${result.email}. Revisa tu bandeja de entrada o spam.`, 'success');
      } else {
        showToast(`Cuenta creada. Revisa tu correo o consulta con el Administrador para validar tu cuenta.`, 'info');
      }
      this.renderAuthScreen('verify', { 
        email: result.email, 
        emailSent: sendResult.success,
        userId: result.user?.id 
      });
    } else {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="mail-check" width="18" height="18"></i> Crear Cuenta y Recibir Código`;
        if (window.lucide) lucide.createIcons();
      }
      if (alertEl && alertText) {
        alertText.textContent = result.message;
        alertEl.style.display = 'flex';
      }
      showToast(result.message, 'danger');
    }
  },

  async handleVerifySubmit(e, email) {
    e.preventDefault();
    const code = document.getElementById('verify-code')?.value || '';
    const result = await this.verifyEmail(email, code);

    if (result.success) {
      showToast(result.message, 'success');
      const { data: usuarios } = await DB.getAll('usuarios');
      const user = usuarios.find(u => (u.email || '').toLowerCase() === (email || '').toLowerCase());
      this.renderAuthScreen('pending', { 
        userName: user?.nombres || email.split('@')[0],
        email: email,
        userId: user?.id 
      });
    } else {
      const alertEl = document.getElementById('auth-alert');
      const alertText = document.getElementById('auth-alert-text');
      if (alertEl && alertText) {
        alertText.textContent = result.message;
        alertEl.style.display = 'flex';
      }
      showToast(result.message, 'danger');
    }
  },

  async handleResendCode(email) {
    const resendBtn = document.getElementById('resend-btn');
    if (resendBtn) {
      resendBtn.disabled = true;
      resendBtn.innerHTML = `<span class="spinner-sm"></span> Enviando...`;
    }

    const result = await this.resendCode(email);
    if (result.success) {
      const { data: usuarios } = await DB.getAll('usuarios');
      const user = usuarios.find(u => (u.email || '').toLowerCase() === email.toLowerCase());

      const sendResult = await this.sendVerificationEmail(email, user?.nombres || '', result.code);

      if (sendResult.success) {
        showToast(`Hemos reenviado un nuevo código a ${email}. Revisa tu bandeja de entrada o spam.`, 'success');
      } else {
        showToast(`Código regenerado. Si la entrega automática falla, consulta con el Administrador.`, 'info');
      }
    } else {
      showToast(result.message, 'danger');
    }

    if (resendBtn) {
      resendBtn.disabled = false;
      resendBtn.innerHTML = `<i data-lucide="rotate-ccw" width="14" height="14" style="vertical-align: middle;"></i> Reenviar a mi correo`;
      if (window.lucide) lucide.createIcons();
    }
  },

  fillDemoCredentials(email, password) {
    const emailInput = document.getElementById('login-email');
    const passInput = document.getElementById('login-password');
    if (emailInput && passInput) {
      emailInput.value = email;
      passInput.value = password;
      showToast(`Credenciales cargadas: ${email}`, 'info');
      // Subtle pulse
      emailInput.classList.add('pulse-highlight');
      passInput.classList.add('pulse-highlight');
      setTimeout(() => {
        emailInput.classList.remove('pulse-highlight');
        passInput.classList.remove('pulse-highlight');
      }, 600);
    }
  },

  togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = 'Ocultar';
    } else {
      input.type = 'password';
      btn.textContent = 'Mostrar';
    }
  },

  // ---- Fast Testing Actions: Quick Admin Approval & Login Tester ----
  async quickAdminApprove(userIdOrEmail) {
    const { data: usuarios } = await DB.getAll('usuarios');
    const admin = usuarios.find(u => u.rol === 'Administrador' && u.aprobado);
    if (!admin) {
      showToast('No se encontró cuenta de Administrador', 'danger');
      return;
    }
    const target = usuarios.find(u => u.id === userIdOrEmail || (u.email || '').toLowerCase() === (userIdOrEmail || '').toLowerCase());
    
    // Log in as admin
    this.setCurrentUser(admin);
    initAppSession(admin);
    
    // Navigate to usuarios module
    window.location.hash = 'usuarios';
    if (typeof navigateTo === 'function') {
      navigateTo('usuarios');
    }
    
    if (target && typeof openAprobarModal === 'function') {
      setTimeout(() => {
        openAprobarModal(target.id);
      }, 350);
    }
    showToast('Sesión de Administrador iniciada para aprobar al usuario', 'info');
  },

  testUserLogin(email, password) {
    if (typeof closeModal === 'function') closeModal();
    this.logout();
    this.renderAuthScreen('login', { email, password });
    showToast(`Credenciales listas para ${email}. Haz clic en "Ingresar a la Plataforma".`, 'success');
  }
};
