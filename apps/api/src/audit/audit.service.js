"use strict";
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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
var common_1 = require("@nestjs/common");
var AuditService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AuditService = _classThis = /** @class */ (function () {
        function AuditService_1(supabase) {
            this.supabase = supabase;
        }
        AuditService_1.prototype.emit = function (event) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, _b, _c, _d, _e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0: return [4 /*yield*/, this.supabase.admin.from('audit_events').insert({
                                type: event.type,
                                bond_token_id: (_a = event.bondTokenId) !== null && _a !== void 0 ? _a : null,
                                transfer_id: (_b = event.transferId) !== null && _b !== void 0 ? _b : null,
                                actor_id: (_c = event.actorId) !== null && _c !== void 0 ? _c : null,
                                payload: (_d = event.payload) !== null && _d !== void 0 ? _d : {},
                                tx_hash: (_e = event.txHash) !== null && _e !== void 0 ? _e : null,
                            })];
                        case 1:
                            _f.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        AuditService_1.prototype.getBondTimeline = function (tokenId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, bond, bondErr, events, transfers;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.supabase.admin
                                .from('bonds')
                                .select('*, parties(*), profiles!bonds_current_owner_fkey(*)')
                                .eq('token_id', tokenId)
                                .single()];
                        case 1:
                            _a = _b.sent(), bond = _a.data, bondErr = _a.error;
                            if (bondErr)
                                throw new common_1.BadRequestException('Bond not found');
                            return [4 /*yield*/, this.supabase.admin
                                    .from('audit_events')
                                    .select('*')
                                    .eq('bond_token_id', tokenId)
                                    .order('created_at', { ascending: true })];
                        case 2:
                            events = (_b.sent()).data;
                            return [4 /*yield*/, this.supabase.admin
                                    .from('transfers')
                                    .select('*, from_profile:profiles!transfers_from_owner_fkey(*), to_profile:profiles!transfers_to_owner_fkey(*)')
                                    .eq('bond_token_id', tokenId)
                                    .order('created_at', { ascending: true })];
                        case 3:
                            transfers = (_b.sent()).data;
                            return [2 /*return*/, { bond: bond, events: events !== null && events !== void 0 ? events : [], transfers: transfers !== null && transfers !== void 0 ? transfers : [] }];
                    }
                });
            });
        };
        AuditService_1.prototype.searchBonds = function (query) {
            return __awaiter(this, void 0, void 0, function () {
                var q, _a, data, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            q = this.supabase.admin
                                .from('bonds')
                                .select('*, parties(*), profiles!bonds_current_owner_fkey(id, full_name, email, role)')
                                .order('created_at', { ascending: false });
                            if (query.tokenId)
                                q = q.eq('token_id', query.tokenId);
                            if (query.bondId)
                                q = q.ilike('bond_id', "%".concat(query.bondId, "%"));
                            if (query.issuerPartyId)
                                q = q.eq('issuer_party_id', query.issuerPartyId);
                            if (query.ownerId)
                                q = q.eq('current_owner', query.ownerId);
                            if (query.status)
                                q = q.eq('status', query.status);
                            return [4 /*yield*/, q];
                        case 1:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error)
                                throw new common_1.BadRequestException(error.message);
                            return [2 /*return*/, data !== null && data !== void 0 ? data : []];
                    }
                });
            });
        };
        AuditService_1.prototype.getRecentEvents = function () {
            return __awaiter(this, arguments, void 0, function (limit) {
                var data;
                if (limit === void 0) { limit = 50; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.supabase.admin
                                .from('audit_events')
                                .select('*, bonds(bond_id, status), profiles!audit_events_actor_id_fkey(full_name, email)')
                                .order('created_at', { ascending: false })
                                .limit(limit)];
                        case 1:
                            data = (_a.sent()).data;
                            return [2 /*return*/, data !== null && data !== void 0 ? data : []];
                    }
                });
            });
        };
        return AuditService_1;
    }());
    __setFunctionName(_classThis, "AuditService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuditService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuditService = _classThis;
}();
exports.AuditService = AuditService;
