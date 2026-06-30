"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var toastPosition = {
  TopLeft: "top-left",
  TopCenter: "top-center",
  TopRight: "top-right",
  BottomLeft: "bottom-left",
  BottomCenter: "bottom-center",
  BottomRight: "bottom-right"
};
var toastPositionIndex = [[toastPosition.TopLeft, toastPosition.TopCenter, toastPosition.TopRight], [toastPosition.BottomLeft, toastPosition.BottomCenter, toastPosition.BottomRight]];
var svgs = {
  success: '<svg viewBox="0 0 426.667 426.667" width="24" height="24"><path d="M213.333 0C95.518 0 0 95.514 0 213.333s95.518 213.333 213.333 213.333c117.828 0 213.333-95.514 213.333-213.333S331.157 0 213.333 0zm-39.134 322.918l-93.935-93.931 31.309-31.309 62.626 62.622 140.894-140.898 31.309 31.309-172.203 172.207z" fill="#1ab163"></path></svg>',
  warn: '<svg viewBox="0 0 310.285 310.285" width=24 height=24> <path d="M264.845 45.441C235.542 16.139 196.583 0 155.142 0 113.702 0 74.743 16.139 45.44 45.441 16.138 74.743 0 113.703 0 155.144c0 41.439 16.138 80.399 45.44 109.701 29.303 29.303 68.262 45.44 109.702 45.44s80.399-16.138 109.702-45.44c29.303-29.302 45.44-68.262 45.44-109.701.001-41.441-16.137-80.401-45.439-109.703zm-132.673 3.895a12.587 12.587 0 0 1 9.119-3.873h28.04c3.482 0 6.72 1.403 9.114 3.888 2.395 2.485 3.643 5.804 3.514 9.284l-4.634 104.895c-.263 7.102-6.26 12.933-13.368 12.933H146.33c-7.112 0-13.099-5.839-13.345-12.945L128.64 58.594c-.121-3.48 1.133-6.773 3.532-9.258zm23.306 219.444c-16.266 0-28.532-12.844-28.532-29.876 0-17.223 12.122-30.211 28.196-30.211 16.602 0 28.196 12.423 28.196 30.211.001 17.591-11.456 29.876-27.86 29.876z" fill="#FFDA44" /> </svg>',
  info: '<svg viewBox="0 0 23.625 23.625" width=24 height=24> <path d="M11.812 0C5.289 0 0 5.289 0 11.812s5.289 11.813 11.812 11.813 11.813-5.29 11.813-11.813S18.335 0 11.812 0zm2.459 18.307c-.608.24-1.092.422-1.455.548a3.838 3.838 0 0 1-1.262.189c-.736 0-1.309-.18-1.717-.539s-.611-.814-.611-1.367c0-.215.015-.435.045-.659a8.23 8.23 0 0 1 .147-.759l.761-2.688c.067-.258.125-.503.171-.731.046-.23.068-.441.068-.633 0-.342-.071-.582-.212-.717-.143-.135-.412-.201-.813-.201-.196 0-.398.029-.605.09-.205.063-.383.12-.529.176l.201-.828c.498-.203.975-.377 1.43-.521a4.225 4.225 0 0 1 1.29-.218c.731 0 1.295.178 1.692.53.395.353.594.812.594 1.376 0 .117-.014.323-.041.617a4.129 4.129 0 0 1-.152.811l-.757 2.68a7.582 7.582 0 0 0-.167.736 3.892 3.892 0 0 0-.073.626c0 .356.079.599.239.728.158.129.435.194.827.194.185 0 .392-.033.626-.097.232-.064.4-.121.506-.17l-.203.827zm-.134-10.878a1.807 1.807 0 0 1-1.275.492c-.496 0-.924-.164-1.28-.492a1.57 1.57 0 0 1-.533-1.193c0-.465.18-.865.533-1.196a1.812 1.812 0 0 1 1.28-.497c.497 0 .923.165 1.275.497.353.331.53.731.53 1.196 0 .467-.177.865-.53 1.193z" fill="#006DF0" /> </svg>',
  error: '<svg viewBox="0 0 51.976 51.976" width=24 height=24> <path d="M44.373 7.603c-10.137-10.137-26.632-10.138-36.77 0-10.138 10.138-10.137 26.632 0 36.77s26.632 10.138 36.77 0c10.137-10.138 10.137-26.633 0-36.77zm-8.132 28.638a2 2 0 0 1-2.828 0l-7.425-7.425-7.778 7.778a2 2 0 1 1-2.828-2.828l7.778-7.778-7.425-7.425a2 2 0 1 1 2.828-2.828l7.425 7.425 7.071-7.071a2 2 0 1 1 2.828 2.828l-7.071 7.071 7.425 7.425a2 2 0 0 1 0 2.828z" fill="#D80027" /> </svg>'
};
var vt = {
  options: {
    title: undefined,
    position: toastPosition.TopCenter,
    duration: 2000,
    closable: true,
    focusable: true,
    callback: undefined
  },
  success: function success(message, options) {
    options.position = 'top-center';
    show(message, options, "success");
  },
  info: function info(message, options) {
    show(message, options, "info");
  },
  warn: function warn(message, options) {
    show(message, options, "warn");
  },
  error: function error(message, options) {
    show(message, options, "error");
  }
};

window.onload = function () {
  var vtContainer = document.createElement("div");
  vtContainer.className = "vt-container";

  for (var _i = 0, _arr = [0, 1]; _i < _arr.length; _i++) {
    var ri = _arr[_i];
    var row = document.createElement("div");
    row.className = "vt-row";

    for (var _i2 = 0, _arr2 = [0, 1, 2]; _i2 < _arr2.length; _i2++) {
      var ci = _arr2[_i2];
      var col = document.createElement("div");
      col.className = "vt-col ".concat(toastPositionIndex[ri][ci]);
      row.appendChild(col);
    }

    vtContainer.appendChild(row);
  }

  var body = document.querySelector('body');
  body.appendChild(vtContainer);
};

function show() {
  var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "My name is Toast, Vanilla Toast.";
  var options = arguments.length > 1 ? arguments[1] : undefined;
  var type = arguments.length > 2 ? arguments[2] : undefined;
  options = _objectSpread(_objectSpread({}, vt.options), options);
  var col = document.getElementsByClassName(options.position)[0];
  var vtCard = document.createElement("div");
  vtCard.className = "vt-card ".concat(type);
  vtCard.innerHTML += svgs[type];
  vtCard.options = _objectSpread(_objectSpread({}, options), {
    message: message,
    type: type,
    yPos: options.position.indexOf("top") > -1 ? "top" : "bottom",
    isFocus: false
  });
  setVTCardContent(vtCard);
  setVTCardIntroAnim(vtCard);
  setVTCardBindEvents(vtCard);
  autoDestroy(vtCard);
  col.appendChild(vtCard);
}

function setVTCardContent(vtCard) {
  var textGroupDiv = document.createElement("div");
  var textGroupDivInner = document.createElement("div");
  /**
   * Close Btn
   * @type {HTMLSpanElement}
   */

  var removeSpan = document.createElement("span");
  var removeI = document.createElement("i");
  removeSpan.className = "close-wrap";
  removeI.className = "icon-close";
  removeSpan.appendChild(removeI);
  removeSpan.addEventListener('click', function () {
    destroy(vtCard);
  });
  textGroupDiv.className = "text-group-wrapper";
  textGroupDivInner.className = "text-group";
  textGroupDivInner.innerHTML += "<h4>".concat(vtCard.options.message, "</h4>");
  textGroupDiv.appendChild(removeSpan);
  textGroupDiv.appendChild(textGroupDivInner);
  vtCard.appendChild(textGroupDiv);
}

function setVTCardIntroAnim(vtCard) {
  vtCard.style.setProperty("margin-".concat(vtCard.options.yPos), "-15px");
  vtCard.style.setProperty("opacity", "0");
  setTimeout(function () {
    vtCard.style.setProperty("margin-".concat(vtCard.options.yPos), "60px");
    vtCard.style.setProperty("opacity", "1");
    vtCard.style.setProperty("right", "1");
  }, 50);
}

function setVTCardBindEvents(vtCard) {
  vtCard.addEventListener("click", function () {
    if (vtCard.options.closable) {
      destroy(vtCard);
    }
  });
  vtCard.addEventListener("mouseover", function () {
    vtCard.options.isFocus = vtCard.options.focusable;
  });
  vtCard.addEventListener("mouseout", function () {
    vtCard.options.isFocus = false;
    autoDestroy(vtCard, vtCard.options.duration);
  });
}

function destroy(vtCard) {
  vtCard.style.setProperty("margin-".concat(vtCard.options.yPos), "-".concat(vtCard.offsetHeight, "px"));
  vtCard.style.setProperty("opacity", "0");
  setTimeout(function () {
    // vtCard.parentNode.removeChild(vtCard)
    if (typeof vtCard.options.callback === "function") {
      vtCard.options.callback();
    }
  }, 500);
}

function autoDestroy(vtCard) {
  if (vtCard.options.duration !== 0) {
    setTimeout(function () {
      if (!vtCard.options.isFocus) {
        destroy(vtCard);
      }
    }, vtCard.options.duration);
  }
}

var _default = vt;
exports["default"] = _default;