// Opt-in preview; normal URLs retain the verified v4 build.
window.TERMINAL_ENGINE_V5=typeof location!=='undefined'&&new URL(location.href).searchParams.get('engine')==='v5';
if (typeof document !== 'undefined') {
  if (window.TERMINAL_ENGINE_V5) {
    document.write('<link rel="stylesheet" href="css/v5_drawing.css">');
    document.write('<script src="vendor/lightweight-charts-5.3.0/lightweight-charts.standalone.production.js"><\/script>');
    document.write('<script src="vendor/lightweight-charts-drawing.umd.cjs"><\/script>');
    document.write('<script src="js/v5_drawing_storage.js"><\/script>');
    document.write('<script src="js/v5_drawing_migrator.js"><\/script>');
    document.write('<script src="js/v5_drawing_settings.js"><\/script>');
    document.write('<script src="js/v5_drawing_floatbar.js"><\/script>');
    document.write('<script src="js/v5_drawing_toolbar.js"><\/script>');
    document.write('<script src="js/v5_drawing_integration.js"><\/script>');
  } else {
    document.write('<script src="js/lightweight-charts.standalone.production.js"><\/script>');
  }
}
