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
exports.TransfersService = void 0;
var common_1 = require("@nestjs/common");
var crypto = require("crypto");
var types_1 = require("@velar/types");
var TransfersService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var TransfersService = _classThis = /** @class */ (function () {
        function TransfersService_1(supabase, audit, escrow) {
            this.supabase = supabase;
            this.audit = audit;
            this.escrow = escrow;
        }
        TransfersService_1.prototype.getBond = function (tokenId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, data, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.supabase.admin
                                .from('bonds').select('*').eq('token_id', tokenId).single()];
                        case 1:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error || !data)
                                throw new common_1.NotFoundException('Bond not found');
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        TransfersService_1.prototype.requestTransfer = function (input, actorId) {
            return __awaiter(this, void 0, void 0, function () {
                var bond, _a, transfer, error;
                var _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.getBond(input.bondTokenId)];
                        case 1:
                            bond = _c.sent();
                            if (bond.current_owner !== actorId)
                                throw new common_1.ForbiddenException('Only the current owner can initiate a transfer');
                            if (types_1.NON_TRANSFERABLE_STATUSES.includes(bond.status)) {
                                throw new common_1.BadRequestException("Bond status \"".concat(bond.status, "\" does not allow transfers"));
                            }
                            return [4 /*yield*/, this.supabase.admin
                                    .from('transfers')
                                    .insert({ bond_token_id: input.bondTokenId, from_owner: actorId, to_owner: input.toOwner, status: types_1.TransferStatus.SOLICITADA, amount: (_b = input.amount) !== null && _b !== void 0 ? _b : null })
                                    .select().single()];
                        case 2:
                            _a = _c.sent(), transfer = _a.data, error = _a.error;
                            if (error)
                                throw new common_1.BadRequestException(error.message);
                            return [4 /*yield*/, this.audit.emit({ type: types_1.AuditEventType.TRANSFER_SOLICITADA, bondTokenId: input.bondTokenId, transferId: transfer.id, actorId: actorId, payload: { toOwner: input.toOwner, amount: input.amount } })];
                        case 3:
                            _c.sent();
                            return [2 /*return*/, transfer];
                    }
                });
            });
        };
        TransfersService_1.prototype.acceptTransfer = function (transferId, actorId) {
            return __awaiter(this, void 0, void 0, function () {
                var transfer, _a, fromProfile, toProfile, escrowContractId, txHash, res, _b, updated;
                var _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, this.supabase.admin.from('transfers').select('*').eq('id', transferId).single()];
                        case 1:
                            transfer = (_d.sent()).data;
                            if (!transfer)
                                throw new common_1.NotFoundException('Transfer not found');
                            if (transfer.to_owner !== actorId)
                                throw new common_1.ForbiddenException('Not the intended buyer');
                            if (transfer.status !== types_1.TransferStatus.SOLICITADA)
                                throw new common_1.BadRequestException('Transfer not in SOLICITADA state');
                            return [4 /*yield*/, this.supabase.admin.from('transfers').update({ status: types_1.TransferStatus.ACEPTADA }).eq('id', transferId)];
                        case 2:
                            _d.sent();
                            return [4 /*yield*/, this.supabase.admin.from('bonds').update({ status: types_1.BondStatus.EN_ESCROW }).eq('token_id', transfer.bond_token_id)];
                        case 3:
                            _d.sent();
                            return [4 /*yield*/, Promise.all([
                                    this.supabase.admin.from('profiles').select('stellar_wallet').eq('id', transfer.from_owner).single(),
                                    this.supabase.admin.from('profiles').select('stellar_wallet').eq('id', transfer.to_owner).single(),
                                ])];
                        case 4:
                            _a = _d.sent(), fromProfile = _a[0].data, toProfile = _a[1].data;
                            if (!((fromProfile === null || fromProfile === void 0 ? void 0 : fromProfile.stellar_wallet) && (toProfile === null || toProfile === void 0 ? void 0 : toProfile.stellar_wallet))) return [3 /*break*/, 8];
                            _d.label = 5;
                        case 5:
                            _d.trys.push([5, 7, , 8]);
                            return [4 /*yield*/, this.escrow.initEscrow({
                                    transferId: transferId,
                                    bondTokenId: transfer.bond_token_id,
                                    seller: fromProfile.stellar_wallet, buyer: toProfile.stellar_wallet,
                                    approver: toProfile.stellar_wallet, amount: (_c = transfer.amount) !== null && _c !== void 0 ? _c : 0,
                                    title: "VELAR Bond Transfer ".concat(transfer.bond_token_id),
                                })];
                        case 6:
                            res = _d.sent();
                            escrowContractId = res.contractId;
                            txHash = res.unsignedTransaction;
                            return [3 /*break*/, 8];
                        case 7:
                            _b = _d.sent();
                            return [3 /*break*/, 8];
                        case 8: return [4 /*yield*/, this.supabase.admin
                                .from('transfers').update({ status: types_1.TransferStatus.EN_ESCROW, escrow_contract_id: escrowContractId !== null && escrowContractId !== void 0 ? escrowContractId : null }).eq('id', transferId).select().single()];
                        case 9:
                            updated = (_d.sent()).data;
                            return [4 /*yield*/, this.audit.emit({ type: types_1.AuditEventType.ESCROW_BLOQUEADO, bondTokenId: transfer.bond_token_id, transferId: transferId, actorId: actorId, payload: { escrowContractId: escrowContractId }, txHash: txHash })];
                        case 10:
                            _d.sent();
                            return [2 /*return*/, updated];
                    }
                });
            });
        };
        TransfersService_1.prototype.registerPayment = function (transferId, evidenceContent, actorId) {
            return __awaiter(this, void 0, void 0, function () {
                var transfer, evidenceHash, updated;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.supabase.admin.from('transfers').select('*').eq('id', transferId).single()];
                        case 1:
                            transfer = (_a.sent()).data;
                            if (!transfer)
                                throw new common_1.NotFoundException();
                            if (transfer.to_owner !== actorId)
                                throw new common_1.ForbiddenException();
                            if (transfer.status !== types_1.TransferStatus.EN_ESCROW)
                                throw new common_1.BadRequestException('Transfer must be in EN_ESCROW state');
                            evidenceHash = crypto.createHash('sha256').update(evidenceContent).digest('hex');
                            return [4 /*yield*/, this.supabase.admin
                                    .from('transfers').update({ status: types_1.TransferStatus.PAGO_REGISTRADO, payment_evidence_hash: evidenceHash }).eq('id', transferId).select().single()];
                        case 2:
                            updated = (_a.sent()).data;
                            return [4 /*yield*/, this.audit.emit({ type: types_1.AuditEventType.PAGO_REGISTRADO, bondTokenId: transfer.bond_token_id, transferId: transferId, actorId: actorId, payload: { evidenceHash: evidenceHash } })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, updated];
                    }
                });
            });
        };
        TransfersService_1.prototype.validatePayment = function (transferId, actorId, actorRole) {
            return __awaiter(this, void 0, void 0, function () {
                var transfer, updated;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!['validador', 'tse', 'admin'].includes(actorRole))
                                throw new common_1.ForbiddenException('Only VALIDADOR can validate payments');
                            return [4 /*yield*/, this.supabase.admin.from('transfers').select('*').eq('id', transferId).single()];
                        case 1:
                            transfer = (_a.sent()).data;
                            if (!transfer)
                                throw new common_1.NotFoundException();
                            if (transfer.status !== types_1.TransferStatus.PAGO_REGISTRADO)
                                throw new common_1.BadRequestException('Payment not registered yet');
                            return [4 /*yield*/, this.supabase.admin
                                    .from('transfers').update({ status: types_1.TransferStatus.PAGO_VALIDADO, validated_by: actorId }).eq('id', transferId).select().single()];
                        case 2:
                            updated = (_a.sent()).data;
                            return [4 /*yield*/, this.audit.emit({ type: types_1.AuditEventType.PAGO_VALIDADO, bondTokenId: transfer.bond_token_id, transferId: transferId, actorId: actorId, payload: {} })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, updated];
                    }
                });
            });
        };
        TransfersService_1.prototype.releaseToken = function (transferId, actorId, actorRole) {
            return __awaiter(this, void 0, void 0, function () {
                var transfer, txHash, profile, result, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!['validador', 'tse', 'admin'].includes(actorRole))
                                throw new common_1.ForbiddenException('Only VALIDADOR can release tokens');
                            return [4 /*yield*/, this.supabase.admin.from('transfers').select('*').eq('id', transferId).single()];
                        case 1:
                            transfer = (_b.sent()).data;
                            if (!transfer)
                                throw new common_1.NotFoundException();
                            if (transfer.status !== types_1.TransferStatus.PAGO_VALIDADO)
                                throw new common_1.BadRequestException('Payment must be validated before releasing');
                            if (!transfer.escrow_contract_id) return [3 /*break*/, 7];
                            _b.label = 2;
                        case 2:
                            _b.trys.push([2, 6, , 7]);
                            return [4 /*yield*/, this.supabase.admin.from('profiles').select('stellar_wallet').eq('id', actorId).single()];
                        case 3:
                            profile = (_b.sent()).data;
                            if (!(profile === null || profile === void 0 ? void 0 : profile.stellar_wallet)) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.escrow.releaseEscrow(transfer.escrow_contract_id, profile.stellar_wallet)];
                        case 4:
                            result = _b.sent();
                            txHash = result === null || result === void 0 ? void 0 : result.txHash;
                            _b.label = 5;
                        case 5: return [3 /*break*/, 7];
                        case 6:
                            _a = _b.sent();
                            return [3 /*break*/, 7];
                        case 7: return [4 /*yield*/, Promise.all([
                                this.supabase.admin.from('bonds').update({ current_owner: transfer.to_owner, status: types_1.BondStatus.ACTIVO }).eq('token_id', transfer.bond_token_id),
                                this.supabase.admin.from('transfers').update({ status: types_1.TransferStatus.LIBERADA }).eq('id', transferId),
                            ])];
                        case 8:
                            _b.sent();
                            return [4 /*yield*/, this.audit.emit({ type: types_1.AuditEventType.TOKEN_LIBERADO, bondTokenId: transfer.bond_token_id, transferId: transferId, actorId: actorId, payload: { newOwner: transfer.to_owner }, txHash: txHash })];
                        case 9:
                            _b.sent();
                            return [2 /*return*/, { success: true, newOwner: transfer.to_owner, txHash: txHash }];
                    }
                });
            });
        };
        TransfersService_1.prototype.cancelTransfer = function (transferId, actorId) {
            return __awaiter(this, void 0, void 0, function () {
                var transfer, cancellable;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.supabase.admin.from('transfers').select('*').eq('id', transferId).single()];
                        case 1:
                            transfer = (_a.sent()).data;
                            if (!transfer)
                                throw new common_1.NotFoundException();
                            if (transfer.from_owner !== actorId && transfer.to_owner !== actorId)
                                throw new common_1.ForbiddenException();
                            cancellable = [types_1.TransferStatus.SOLICITADA, types_1.TransferStatus.ACEPTADA, types_1.TransferStatus.EN_ESCROW];
                            if (!cancellable.includes(transfer.status))
                                throw new common_1.BadRequestException('Cannot cancel at this stage');
                            return [4 /*yield*/, Promise.all([
                                    this.supabase.admin.from('bonds').update({ status: types_1.BondStatus.ACTIVO }).eq('token_id', transfer.bond_token_id),
                                    this.supabase.admin.from('transfers').update({ status: types_1.TransferStatus.CANCELADA }).eq('id', transferId),
                                ])];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, this.audit.emit({ type: types_1.AuditEventType.TRANSFER_CANCELADA, bondTokenId: transfer.bond_token_id, transferId: transferId, actorId: actorId, payload: {} })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, { success: true }];
                    }
                });
            });
        };
        TransfersService_1.prototype.findMyTransfers = function (actorId, actorRole) {
            return __awaiter(this, void 0, void 0, function () {
                var q, data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            q = this.supabase.admin
                                .from('transfers')
                                .select('*, bonds(bond_id, status, face_value), from_profile:profiles!transfers_from_owner_fkey(id, full_name, email), to_profile:profiles!transfers_to_owner_fkey(id, full_name, email)')
                                .order('created_at', { ascending: false });
                            if (!['tse', 'admin'].includes(actorRole)) {
                                if (actorRole === 'validador') {
                                    q = q.in('status', ['pago_registrado', 'pago_validado']);
                                }
                                else {
                                    q = q.or("from_owner.eq.".concat(actorId, ",to_owner.eq.").concat(actorId));
                                }
                            }
                            return [4 /*yield*/, q];
                        case 1:
                            data = (_a.sent()).data;
                            return [2 /*return*/, data !== null && data !== void 0 ? data : []];
                    }
                });
            });
        };
        TransfersService_1.prototype.findOne = function (transferId) {
            return __awaiter(this, void 0, void 0, function () {
                var data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.supabase.admin
                                .from('transfers')
                                .select('*, bonds(*), from_profile:profiles!transfers_from_owner_fkey(*), to_profile:profiles!transfers_to_owner_fkey(*), validator:profiles!transfers_validated_by_fkey(id, full_name)')
                                .eq('id', transferId)
                                .single()];
                        case 1:
                            data = (_a.sent()).data;
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        return TransfersService_1;
    }());
    __setFunctionName(_classThis, "TransfersService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TransfersService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TransfersService = _classThis;
}();
exports.TransfersService = TransfersService;
