import type { Register } from 'claude-code'

// Texts per language. The mod follows the `language` key of your settings.json ("Español" -> es).
const T = {
  en: {
    commandDescription: 'Turn the Steroids gateway (OmniRoute) on or off for new sessions',
    usage: 'Usage: /steroids on | off | status',
    failed: 'Could not switch',
    unknownError: 'unknown error',
    newSession: 'This session does not change: open a new one (restart every terminal if you run several).',
    thisSession: (live: boolean) => `This session: ${live ? 'uses Steroids' : 'normal connection'}.`,
    nextSessions: (saved: boolean) => `New sessions: ${saved ? 'will use Steroids' : 'normal connection'}.`,
    live: '💪 Steroids',
    normal: '⚪ Normal',
    pending: (saved: boolean) => `🟡 Steroids ${saved ? 'on' : 'off'}: restart`,
    hints: `# Your plugins (kept on by Steroids)
- ponytail: apply its ladder (do not write what is not needed, reuse, stdlib first) on every coding task.
- frontend-design: when building or redesigning UI, load its skill before writing it.
- mempalace: before answering about past work, earlier decisions, people or projects, search the palace first with mempalace_search (skill mempalace-recall).`,
  },
  es: {
    commandDescription: 'Activa o desactiva el gateway Steroids (OmniRoute) en sesiones nuevas',
    usage: 'Uso: /steroids on | off | status',
    failed: 'No se pudo cambiar',
    unknownError: 'error desconocido',
    newSession: 'Esta sesión no cambia: abre una nueva (si usas varias terminales, reinícialas todas).',
    thisSession: (live: boolean) => `Esta sesión: ${live ? 'usa Steroids' : 'conexión normal'}.`,
    nextSessions: (saved: boolean) => `Sesiones nuevas: ${saved ? 'usarán Steroids' : 'conexión normal'}.`,
    live: '💪 Steroids',
    normal: '⚪ Normal',
    pending: (saved: boolean) => `🟡 Steroids ${saved ? 'on' : 'off'}: reinicia`,
    hints: `# Tus plugins (los mantiene activos Steroids)
- ponytail: aplica su escalera (no escribir lo innecesario, reutilizar, stdlib primero) en toda tarea de código.
- frontend-design: para construir o rediseñar interfaces, carga su skill antes de escribir UI.
- mempalace: antes de responder sobre trabajo pasado, decisiones previas, personas o proyectos, busca primero en el palacio con mempalace_search (skill mempalace-recall).`,
  },
}

// The gateway listens on a local port: OmniRoute's default is 20128.
const usesGateway = (url: string | undefined) => /localhost:\d+|127\.0\.0\.1:\d+/.test(url ?? '')

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const language = (await $.settings.read({ key: 'language' })) as string | undefined
    const t = /^es/i.test(language ?? '') ? T.es : T.en
    await $.command.register({
      name: 'steroids',
      description: t.commandDescription,
      argumentHint: 'on | off | status',
    })
    const env = (await $.settings.read({ key: 'env' })) as Record<string, string> | undefined
    if (usesGateway(env?.ANTHROPIC_BASE_URL)) {
      // The gateway must be up if the configuration points at it.
      const home = (await $.env.get('USERPROFILE')) ?? (await $.env.get('HOME'))
      await $.process.run(['node', `${home}/.claude/steroids/toggle.js`, 'ensure'], { timeoutMs: 120000 })
    }
    return next(e)
  })

  on('command.run', { command: 'steroids' }, async ($, e) => {
    const language = (await $.settings.read({ key: 'language' })) as string | undefined
    const lang = /^es/i.test(language ?? '') ? 'es' : 'en'
    const t = T[lang]
    const arg = e.args.trim().toLowerCase()
    if (arg !== '' && arg !== 'status' && arg !== 'on' && arg !== 'off') return { text: t.usage }

    let said = ''
    if (arg === 'on' || arg === 'off') {
      const home = (await $.env.get('USERPROFILE')) ?? (await $.env.get('HOME'))
      const run = await $.process.run(['node', `${home}/.claude/steroids/toggle.js`, arg], {
        timeoutMs: 120000,
        env: { STEROIDS_LANG: lang },
      })
      if (run.exitCode !== 0) return { text: `${t.failed}: ${run.stdout.trim() || t.unknownError}` }
      said = `${run.stdout.trim()}\n${t.newSession}\n`
    }

    const live = usesGateway(await $.env.get('ANTHROPIC_BASE_URL'))
    const env = (await $.settings.read({ key: 'env' })) as Record<string, string> | undefined
    const saved = usesGateway(env?.ANTHROPIC_BASE_URL)
    return { text: `${said}${t.thisSession(live)} ${t.nextSessions(saved)}` }
  })

  // Badge: a dim label at the right of the prompt footer, next to "? for shortcuts".
  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    const language = (await $.settings.read({ key: 'language' })) as string | undefined
    const t = /^es/i.test(language ?? '') ? T.es : T.en
    const live = usesGateway(await $.env.get('ANTHROPIC_BASE_URL'))
    const env = (await $.settings.read({ key: 'env' })) as Record<string, string> | undefined
    const saved = usesGateway(env?.ANTHROPIC_BASE_URL)
    const badge = live === saved ? (live ? t.live : t.normal) : t.pending(saved)
    return next({ ...e, props: { ...e.props, modes: [...e.props.modes, badge] } })
  })

  // Reminder about your plugins, appended to the system prompt.
  on('prompt.compose', async ($, e, next) => {
    const language = (await $.settings.read({ key: 'language' })) as string | undefined
    const t = /^es/i.test(language ?? '') ? T.es : T.en
    const out = await next(e)
    return { sections: [...out.sections, { id: 'steroids:plugins', text: t.hints, scope: 'session' }] }
  })
}
