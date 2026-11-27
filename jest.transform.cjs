const { TsJestTransformer } = require('ts-jest')

class ViteMetaTransformer extends TsJestTransformer {
  getCacheKey(sourceText, sourcePath, options) {
    return `${super.getCacheKey(sourceText, sourcePath, options)}:vite-meta`
  }

  process(sourceText, sourcePath, options) {
    const result = super.process(sourceText, sourcePath, options)
    const replace = (code) => code.replace(/\bimport\.meta\.env\b/g, '({ DEV: false })')
    if (typeof result === 'string') return replace(result)
    return { ...result, code: replace(result.code) }
  }
}

module.exports = {
  createTransformer: (config) => new ViteMetaTransformer(config),
}

