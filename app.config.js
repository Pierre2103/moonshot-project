export default {
  expo: {
    name: "moonshot-project",
    slug: "moonshot-project",
    // ...other config
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.164:5001',
    },
  },
};
