module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', '2cadd842830a8920e8bed786e99435aa'),
  },
});
