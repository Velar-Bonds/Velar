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
exports.AuditController = void 0;
var common_1 = require("@nestjs/common");
var auth_guard_1 = require("../auth/auth.guard");
var AuditController = function () {
    var _classDecorators = [(0, common_1.Controller)('audit'), (0, common_1.UseGuards)(auth_guard_1.AuthGuard)];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _searchBonds_decorators;
    var _getBondTimeline_decorators;
    var _getRecentEvents_decorators;
    var AuditController = _classThis = /** @class */ (function () {
        function AuditController_1(audit) {
            this.audit = (__runInitializers(this, _instanceExtraInitializers), audit);
        }
        AuditController_1.prototype.searchBonds = function (query, user) {
            var _a;
            var role = (_a = user.profile) === null || _a === void 0 ? void 0 : _a.role;
            if (!['tse', 'admin'].includes(role))
                throw new common_1.ForbiddenException('TSE/Admin only');
            return this.audit.searchBonds(query);
        };
        AuditController_1.prototype.getBondTimeline = function (tokenId, user) {
            var _a;
            var role = (_a = user.profile) === null || _a === void 0 ? void 0 : _a.role;
            if (!['tse', 'admin'].includes(role))
                throw new common_1.ForbiddenException('TSE/Admin only');
            return this.audit.getBondTimeline(tokenId);
        };
        AuditController_1.prototype.getRecentEvents = function (limit, user) {
            var _a;
            var role = (_a = user.profile) === null || _a === void 0 ? void 0 : _a.role;
            if (!['tse', 'admin'].includes(role))
                throw new common_1.ForbiddenException('TSE/Admin only');
            return this.audit.getRecentEvents(limit ? Number(limit) : 50);
        };
        return AuditController_1;
    }());
    __setFunctionName(_classThis, "AuditController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _searchBonds_decorators = [(0, common_1.Get)('bonds')];
        _getBondTimeline_decorators = [(0, common_1.Get)('bonds/:tokenId/timeline')];
        _getRecentEvents_decorators = [(0, common_1.Get)('events')];
        __esDecorate(_classThis, null, _searchBonds_decorators, { kind: "method", name: "searchBonds", static: false, private: false, access: { has: function (obj) { return "searchBonds" in obj; }, get: function (obj) { return obj.searchBonds; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getBondTimeline_decorators, { kind: "method", name: "getBondTimeline", static: false, private: false, access: { has: function (obj) { return "getBondTimeline" in obj; }, get: function (obj) { return obj.getBondTimeline; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getRecentEvents_decorators, { kind: "method", name: "getRecentEvents", static: false, private: false, access: { has: function (obj) { return "getRecentEvents" in obj; }, get: function (obj) { return obj.getRecentEvents; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuditController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuditController = _classThis;
}();
exports.AuditController = AuditController;
