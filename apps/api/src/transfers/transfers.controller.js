"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransfersController = void 0;
var common_1 = require("@nestjs/common");
var auth_guard_1 = require("../auth/auth.guard");
var TransfersController = function () {
    var _classDecorators = [(0, common_1.Controller)('transfers'), (0, common_1.UseGuards)(auth_guard_1.AuthGuard)];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _findAll_decorators;
    var _findOne_decorators;
    var _request_decorators;
    var _accept_decorators;
    var _registerPayment_decorators;
    var _validate_decorators;
    var _release_decorators;
    var _cancel_decorators;
    var TransfersController = _classThis = /** @class */ (function () {
        function TransfersController_1(transfers) {
            this.transfers = (__runInitializers(this, _instanceExtraInitializers), transfers);
        }
        TransfersController_1.prototype.findAll = function (user) {
            var _a;
            return this.transfers.findMyTransfers(user.id, (_a = user.profile) === null || _a === void 0 ? void 0 : _a.role);
        };
        TransfersController_1.prototype.findOne = function (id) { return this.transfers.findOne(id); };
        TransfersController_1.prototype.request = function (body, user) {
            return this.transfers.requestTransfer(body, user.id);
        };
        TransfersController_1.prototype.accept = function (id, user) {
            return this.transfers.acceptTransfer(id, user.id);
        };
        TransfersController_1.prototype.registerPayment = function (id, body, user) {
            return this.transfers.registerPayment(id, body.evidenceContent, user.id);
        };
        TransfersController_1.prototype.validate = function (id, user) {
            var _a;
            return this.transfers.validatePayment(id, user.id, (_a = user.profile) === null || _a === void 0 ? void 0 : _a.role);
        };
        TransfersController_1.prototype.release = function (id, user) {
            var _a;
            return this.transfers.releaseToken(id, user.id, (_a = user.profile) === null || _a === void 0 ? void 0 : _a.role);
        };
        TransfersController_1.prototype.cancel = function (id, user) {
            return this.transfers.cancelTransfer(id, user.id);
        };
        return TransfersController_1;
    }());
    __setFunctionName(_classThis, "TransfersController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _findAll_decorators = [(0, common_1.Get)()];
        _findOne_decorators = [(0, common_1.Get)(':id')];
        _request_decorators = [(0, common_1.Post)()];
        _accept_decorators = [(0, common_1.Patch)(':id/accept')];
        _registerPayment_decorators = [(0, common_1.Patch)(':id/payment')];
        _validate_decorators = [(0, common_1.Patch)(':id/validate')];
        _release_decorators = [(0, common_1.Patch)(':id/release')];
        _cancel_decorators = [(0, common_1.Patch)(':id/cancel')];
        __esDecorate(_classThis, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: function (obj) { return "findAll" in obj; }, get: function (obj) { return obj.findAll; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: function (obj) { return "findOne" in obj; }, get: function (obj) { return obj.findOne; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _request_decorators, { kind: "method", name: "request", static: false, private: false, access: { has: function (obj) { return "request" in obj; }, get: function (obj) { return obj.request; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _accept_decorators, { kind: "method", name: "accept", static: false, private: false, access: { has: function (obj) { return "accept" in obj; }, get: function (obj) { return obj.accept; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _registerPayment_decorators, { kind: "method", name: "registerPayment", static: false, private: false, access: { has: function (obj) { return "registerPayment" in obj; }, get: function (obj) { return obj.registerPayment; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _validate_decorators, { kind: "method", name: "validate", static: false, private: false, access: { has: function (obj) { return "validate" in obj; }, get: function (obj) { return obj.validate; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _release_decorators, { kind: "method", name: "release", static: false, private: false, access: { has: function (obj) { return "release" in obj; }, get: function (obj) { return obj.release; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _cancel_decorators, { kind: "method", name: "cancel", static: false, private: false, access: { has: function (obj) { return "cancel" in obj; }, get: function (obj) { return obj.cancel; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TransfersController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TransfersController = _classThis;
}();
exports.TransfersController = TransfersController;
