UPDATE site_settings 
SET value = jsonb_set(
  value::jsonb, 
  '{google_maps_url}', 
  '"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2849.2535405752187!2d90.7803191577663!3d24.435503237190947!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3756938f90bb9891%3A0x6829877754a8f7b7!2sBelly%20full%20Cafe%20%26%20Restaurant!5e1!3m2!1sen!2sbd!4v1775211792984!5m2!1sen!2sbd"'
)
WHERE key = 'general';