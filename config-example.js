module.exports.getEnvVars = () => {
  return {
    dev: {
      TELEGRAM_BOT_TOKEN: '',
      CLARAFAI_API_KEY: '',
    },
    prod: {
      TELEGRAM_BOT_TOKEN: '',
      CLARAFAI_API_KEY: '',
    },
  };
};
