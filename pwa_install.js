// جسر تثبيت تطبيق عقار على الشاشة الرئيسية.
//
// يلتقط حدث beforeinstallprompt الذي يطلقه Chrome/Edge عندما يصبح التطبيق
// قابلاً للتثبيت، ويمنع ظهوره التلقائي، ثم يعرض واجهة Flutter الزر الخاص بها
// عبر window.aqarPwa. المتصفحات التي لا تدعم الحدث (Firefox/Safari) تُبقي
// isAvailable() = false فلا يظهر الاقتراح.
(function () {
  var deferredPrompt = null;
  var listeners = [];

  function notify() {
    for (var i = 0; i < listeners.length; i++) {
      try {
        listeners[i]();
      } catch (_) {}
    }
  }

  function isStandalone() {
    try {
      if (window.matchMedia('(display-mode: standalone)').matches) return true;
      if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
      return window.navigator.standalone === true;
    } catch (_) {
      return false;
    }
  }

  window.aqarPwa = {
    isAvailable: function () {
      return deferredPrompt !== null;
    },
    isStandalone: isStandalone,
    // يعيد 'accepted' أو 'dismissed' أو 'unavailable'.
    promptInstall: function () {
      if (!deferredPrompt) return Promise.resolve('unavailable');
      var event = deferredPrompt;
      // لا يمكن استخدام الحدث مرتين، وبعد استهلاكه نُخفي الاقتراح.
      deferredPrompt = null;
      try {
        event.prompt();
      } catch (_) {
        notify();
        return Promise.resolve('unavailable');
      }
      notify();
      return event.userChoice.then(
        function (choice) {
          notify();
          return (choice && choice.outcome) || 'dismissed';
        },
        function () {
          notify();
          return 'dismissed';
        }
      );
    },
    onChange: function (callback) {
      if (typeof callback === 'function') listeners.push(callback);
    },
  };

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredPrompt = event;
    notify();
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    notify();
  });
})();
