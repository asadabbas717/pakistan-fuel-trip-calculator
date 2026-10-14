module.exports = ({ config }) => {
  if (process.env.FUELTRIP_BUILD_VARIANT !== "preview") return config;
  return {
    ...config,
    name: "SafarWise Preview",
    android: {
      ...config.android,
      package: "com.fueltrippk.preview",
    },
  };
};
