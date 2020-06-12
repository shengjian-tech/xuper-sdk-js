/**
 * @file test file - account sdk
 * Created by xinyi on 2019/11/27
 */

/* eslint-disable no-undef */
jest.setTimeout(100000000);
import {isBrowser} from '../src/utils';
import XuperSDK, {Cryptography, Language, Strength} from '../src';

if (isBrowser()) {
    require('whatwg-fetch');
}
else {
    require('dotenv').config();
}

const node = process.env.NODE || '';
const chain = 'xuper';
const preExecServer = process.env.PRE_EXEC_SERVER || '';

const endorseConfs = {
    name: 'Compliance',
    fee: process.env.FEE || '',
    server: process.env.ENDORSE_SERVER || '',
    endorseServiceCheckAddr: process.env.SERVICE_SIGN_ADDRESS || '',
    endorseServiceFeeAddr: process.env.SERVICE_FEE_ADDRESS || ''
};

describe('Xuper SDK', () => {

    test('create an account with mnemonic should return account model', () => {
        const xsdk = new XuperSDK({node: '', chain: 'xuper'});
        const accountModel = xsdk.createAccount(
            Language.SimplifiedChinese,
            Strength.Easy,
            Cryptography.EccFIPS
        );

        expect(accountModel).toHaveProperty('mnemonic');
        expect(accountModel).toHaveProperty('address');
        expect(accountModel).toHaveProperty('publicKey');
        expect(accountModel).toHaveProperty('privateKey');
    });

    test('revert account info with mnemonic should return account model', () => {
        const xsdk = new XuperSDK({node: '', chain: 'xuper'});

        const accountModel = xsdk.createAccount(
            Language.SimplifiedChinese,
            Strength.Easy,
            Cryptography.EccFIPS
        );

        const revertAccountModel = xsdk.revertAccount(
            accountModel.mnemonic!,
            Language.SimplifiedChinese,
            Cryptography.EccFIPS
        );

        expect(revertAccountModel.mnemonic).toEqual(accountModel.mnemonic);
        expect(revertAccountModel.address).toEqual(accountModel.address);
        expect(revertAccountModel.privateKey).toEqual(accountModel.privateKey);
        expect(revertAccountModel.publicKey).toEqual(accountModel.publicKey);
    });

    test('check mnemonic valid should return true', () => {
        const xsdk = new XuperSDK({node: '', chain: 'xuper'});

        const accountModel = xsdk.createAccount(
            Language.SimplifiedChinese,
            Strength.Easy,
            Cryptography.EccFIPS
        );

        const result = xsdk.checkMnemonic(
            accountModel.mnemonic!,
            Language.SimplifiedChinese
        );
        expect(result).toBeTruthy();
    });

    test('check mnemonic valid should return false', () => {
        const xsdk = new XuperSDK({node: '', chain: 'xuper'});

        const accountModel = xsdk.createAccount(
            Language.SimplifiedChinese,
            Strength.Easy,
            Cryptography.EccFIPS
        );

        const invaildMnemonic = accountModel.mnemonic!.split(' ');
        invaildMnemonic[0] = '牁';

        const result = xsdk.checkMnemonic(
            invaildMnemonic.join(' '),
            Language.SimplifiedChinese
        );
        expect(result).not.toBeTruthy();
    });

    test('check address valid should return true', () => {
        const xsdk = new XuperSDK({node: '', chain: 'xuper'});
        expect(xsdk.checkAddress('nuSMPvo6UUoTaT8mMQmHbfiRbJNbAymGh')).toBeTruthy();
    });

    test('check address valid should return false', () => {
        const xsdk = new XuperSDK({node: '', chain: 'xuper'});
        const accountModel = xsdk.createAccount(
            Language.SimplifiedChinese,
            Strength.Easy,
            Cryptography.EccFIPS
        );

        const result = accountModel.address.substr(accountModel.address.length - 5);
        expect(xsdk.checkAddress(result)).not.toBeTruthy();
    });

    if (process.env.LOCAL_ENV !== 'XuperOS') {
        console.warn('Skip unsupported tests');
        return;
    }

    /**
     * Basic information
     */

    test('get local account balance should return balance struct', async () => {
        const xsdk = new XuperSDK({node, chain});

        const accountModel = xsdk.revertAccount(
            process.env.TEST_MNEMONIC || '',
            Language.SimplifiedChinese,
            Cryptography.EccFIPS
        );

        const balance = await xsdk.getBalance();
        console.warn(JSON.stringify(balance, null, 4));
        expect(balance).toHaveProperty('bcs');
        expect(balance.bcs).toHaveLength(1);
        expect(balance.bcs[0]).toHaveProperty('bcname', chain);
        expect(balance.bcs[0]).toHaveProperty('balance');
    });

    test('get local account balance detail should return balance detail struct', async () => {
        const xsdk = new XuperSDK({node, chain});

        xsdk.revertAccount(
            process.env.TEST_MNEMONIC || '',
            Language.SimplifiedChinese,
            Cryptography.EccFIPS
        );

        const balanceDetail = await xsdk.getBalanceDetail();
        console.warn(JSON.stringify(balanceDetail, null, 4));
        expect(balanceDetail).toHaveProperty('tfds');
        expect(balanceDetail.tfds).toHaveLength(1);
        expect(balanceDetail.tfds[0]).toHaveProperty('bcname', chain);
        expect(balanceDetail.tfds[0]).toHaveProperty('tfd');
        expect(balanceDetail.tfds[0].tfd).toHaveLength(2);
        expect(balanceDetail.tfds[0].tfd[0]).toHaveProperty('balance');
        expect(balanceDetail.tfds[0].tfd[0]).toHaveProperty('isFrozen');
        expect(balanceDetail.tfds[0].tfd[1]).toHaveProperty('balance');
    });

    /**
     * Transaction
     */

    test('post pre-transaction with utxo should return bcname, response, utxoOutput', async () => {
        const xsdk = new XuperSDK({
            node,
            chain,
            preExecServer,
            needDefaultEndorse: true,
            defaultEndorseConf: endorseConfs
        });

        xsdk.revertAccount(
            process.env.TEST_MNEMONIC || '',
            Language.SimplifiedChinese,
            Cryptography.EccFIPS
        );

        const result = await xsdk.preExecTransactionWithUTXO(
            '1',
            []
        );

        console.warn(JSON.stringify(result, null, 4));

        const resultObj = JSON.parse(atob(result.ResponseData));
        expect(resultObj.bcname).toEqual(chain);
        expect(resultObj.header).toHaveProperty('logid');
        expect(resultObj.utxoOutput).toHaveProperty('utxoList');
    });

    test('post pre-transaction without endorse service should return bcname, response, utxoOutput', async () => {
        const xsdk = new XuperSDK({
            node,
            chain,
            preExecServer
        });

        xsdk.revertAccount(
            process.env.TEST_MNEMONIC || '',
            Language.SimplifiedChinese,
            Cryptography.EccFIPS
        );

        const result = await xsdk.preExecTransactionWithUTXO(
            '1',
            []
        );

        const resultObj = JSON.parse(atob(result.ResponseData));
        expect(resultObj.bcname).toEqual(chain);
        expect(resultObj.header).toHaveProperty('logid');
        expect(resultObj.utxoOutput).toHaveProperty('utxoList');
    });

    test('post identity check failed pre-transaction with utxo should 500 status', async () => {
        const xsdk = new XuperSDK({
            node,
            chain,
            preExecServer,
            needDefaultEndorse: true,
            defaultEndorseConf: endorseConfs
        });

        xsdk.revertAccount(
            process.env.TEST_MNEMONIC || '',
            Language.SimplifiedChinese,
            Cryptography.EccFIPS
        );

        try {
            const result = await xsdk.preExecTransactionWithUTXO(
                '1',
                []
            );
        } catch (err) {
            expect(err).toHaveProperty('error');
        }
    });

    test('generate transaction should return transaction model', async () => {
        const xsdk = new XuperSDK({
            node,
            chain,
            preExecServer,
            needDefaultEndorse: true,
            defaultEndorseConf: endorseConfs
        });

        xsdk.revertAccount(
            process.env.TEST_MNEMONIC || '',
            Language.SimplifiedChinese,
            Cryptography.EccFIPS
        );

        const tx = await xsdk.generateTransaction({
            to: process.env.TEST_TARGET_ADDRESS || '',
            amount: '100',
            fee: '100'
        });

        const result = await xsdk.postTransaction(tx);

        expect(result.header).toHaveProperty('logid');
        expect(result.header).not.toHaveProperty('error');
    });

    test('generate transaction without endorse service should return transaction model', async () => {
        const xsdk = new XuperSDK({
            node,
            chain,
            preExecServer
        });

        xsdk.revertAccount(
            process.env.TEST_MNEMONIC || '',
            Language.SimplifiedChinese,
            Cryptography.EccFIPS
        );

        const tx = await xsdk.generateTransaction({
            to: process.env.TEST_TARGET_ADDRESS || '',
            amount: '100',
            fee: '100'
        });

        console.log(tx);

        const result = await xsdk.postTransaction(tx);
        console.log(result);
        expect(result.header).toHaveProperty('logid');
        expect(result.header).not.toHaveProperty('error');
    });

    test('generate transaction with desc should return transaction model', async () => {
        const xsdk = new XuperSDK({
            node,
            chain,
            preExecServer,
            needDefaultEndorse: true,
            defaultEndorseConf: endorseConfs
        });

        xsdk.revertAccount(
            process.env.TEST_MNEMONIC || '',
            Language.SimplifiedChinese,
            Cryptography.EccFIPS
        );

        const tx = await xsdk.generateTransaction({
            to: process.env.TEST_TARGET_ADDRESS || '',
            amount: '100',
            fee: '100',
            desc: 'Hi 你好 こんにちは'
        });

        const result = await xsdk.postTransaction(tx);
        expect(result.header).toHaveProperty('logid');
        expect(result.header).not.toHaveProperty('error');
    });

    test('query transaction should return transaction status', async () => {
        const xsdk = new XuperSDK({
            node,
            chain,
            preExecServer,
            needDefaultEndorse: true,
            defaultEndorseConf: endorseConfs
        });

        const txid = '/aGXihDS0VmgQCzazB2gtTHD77P1UPh4wRicDp5jdZA=';

        const result = await xsdk.queryTransaction(txid);
        expect(result.header).toHaveProperty('logid');
        expect(result.header).not.toHaveProperty('error');
        expect(result.txid).toEqual(txid);
        expect(result).toHaveProperty('status');
    });

    // test('post transaction should return logid', async() => {});

    /**
     * Contract
     */

    // create contract account
    test('create contract account should return successful transaction result', async () => {
        const xsdk = new XuperSDK({
            node,
            chain,
            preExecServer,
            needDefaultEndorse: true,
            defaultEndorseConf: endorseConfs
        });

        xsdk.revertAccount(
            process.env.TEST_MNEMONIC || '',
            Language.SimplifiedChinese,
            Cryptography.EccFIPS
        );

        const result = await xsdk.createContractAccount(
             parseInt('1234567890' + (~~(Math.random() * (999999 - 100000) + 100000).toString()))
        );

        expect(result.header).toHaveProperty('logid');
        expect(result.header).not.toHaveProperty('error');
    });

    // deploy contract
    test('deploy webassembly contract should return successful transaction result', async () => {
        const xsdk = new XuperSDK({
            node,
            chain,
            preExecServer,
            needDefaultEndorse: true,
            defaultEndorseConf: endorseConfs
        });

        xsdk.revertAccount(
            process.env.TEST_MNEMONIC || '',

            Language.SimplifiedChinese,
            Cryptography.EccFIPS
        );

        const codeBuf: string[] = [];

        if (isBrowser()) {
            // test/jest/custom-test-env.js
            // @ts-ignore
            window.file.forEach(n => codeBuf.push(String.fromCharCode(n)));
        } else {
            const fs = require('fs');
            let f = Uint8Array.from(fs.readFileSync(`${__dirname}/contract_code/counter.wasm`))
            f.forEach(n => codeBuf.push(String.fromCharCode(n)));
        }

        const contractName = `counter${~~(Math.random() * 10 ** 3 - 10 ** 3) + 10 ** 3}`;

        const result = await xsdk.deployWasmContract(
            'XC1234567890145964@xuper',
            contractName,
            codeBuf.join(''),
            'c',
            {
                creator: 'xchain'
            }
        );

        expect(result.header).toHaveProperty('logid');
        expect(result.header).not.toHaveProperty('error');
    });

    test('deploy webassembly contract without endorse should return successful transaction result', async () => {
        const xsdk = new XuperSDK({
            node,
            chain,
            preExecServer
        });

        xsdk.revertAccount(
            process.env.TEST_MNEMONIC || '',

            Language.SimplifiedChinese,
            Cryptography.EccFIPS
        );

        const codeBuf: string[] = [];

        if (isBrowser()) {
            // test/jest/custom-test-env.js
            // @ts-ignore
            window.file.forEach(n => codeBuf.push(String.fromCharCode(n)));
        } else {
            const fs = require('fs');
            let f = Uint8Array.from(fs.readFileSync(`${__dirname}/contract_code/counter.wasm`))
            f.forEach(n => codeBuf.push(String.fromCharCode(n)));
        }

        const contractName = `counter${~~(Math.random() * 10 ** 3 - 10 ** 3) + 10 ** 3}`;

        const result = await xsdk.deployWasmContract(
            'XC1234567890145964@xuper',
            contractName,
            codeBuf.join(''),
            'c',
            {
                creator: 'xchain'
            }
        );

        console.log(contractName);

        expect(result.header).toHaveProperty('logid');
        expect(result.header).not.toHaveProperty('error');
    });

    // invoke contract
    test('invoke webassembly contract should return successful transaction result', async () => {
        const xsdk = new XuperSDK({
            node,
            chain,
            preExecServer,
            needDefaultEndorse: true,
            defaultEndorseConf: endorseConfs
        });

        xsdk.revertAccount(
            process.env.TEST_MNEMONIC || '',
            Language.SimplifiedChinese,
            Cryptography.EccFIPS
        );

        const result = await xsdk.invokeContract('counter715', 'get', 'wasm', {
            Bucket: btoa('XCAccount'),
            Key: btoa('XC1234567890145964@xuper')
        });

        expect(result.header).toHaveProperty('logid');
        expect(result.header).not.toHaveProperty('error');
    });

    test('invoke webassembly contract without endorse should return successful transaction result', async () => {
        const xsdk = new XuperSDK({
            node,
            chain,
            preExecServer
        });

        xsdk.revertAccount(
            process.env.TEST_MNEMONIC || '',
            Language.SimplifiedChinese,
            Cryptography.EccFIPS
        );

        const result = await xsdk.invokeContract('counter715', 'get', 'wasm', {
            Bucket: btoa('XCAccount'),
            Key: btoa('XC1234567890145964@xuper')
        });

        expect(result.header).toHaveProperty('logid');
        expect(result.header).not.toHaveProperty('error');
    });

    test('import private key', () => {
        const xsdk = new XuperSDK({
            node,
            chain,
            preExecServer
        });

        const privateKeyStr = 'RziKPHM0e6icCkXe0t5g1XCoXEorf/u5KNNV+l55LeWYgyD5aNySqIpnFwmr/WGegCjPZjv69x2CVbT/WkxAUM7G9ccZre7iJfULLzMzrp4Vf3lRqt6iP883fCcTGrgSxJeIQBYtTw1olrFdC9lXqhEfD94UuK04lrxXYN1HOTZHkg0oCJRUM1eECfYXwWVaPf9xZ59ZEh5/D5UYKKdBwKQbuRe22Hj/5I0N0WOzGoa86FUZusrv2lLjUxe0BscCCVZ1rvFdIMWuOCySYs4oNDLhnT6lD3FeXSZbO0cYC3s2dsXasAkSk5ioE9umtxoZxI/AQAdavLJtgeYkakNgzL+qBdL/CoqbtJEJgD/4ZIo=';

        const model = xsdk.importAccout('1', privateKeyStr);
        expect(model).toHaveProperty('privateKey');
        expect(model).toHaveProperty('publicKey');
        expect(model).toHaveProperty('address');
        expect(model.privateKey.X)
            .toBe('61657808827957283567736545770323618905460909308953839100214462605424684649873');
        expect(model.privateKey.Y)
            .toBe('21136816327134648174270159577816004589179431005681578276352060189744400462107');
        expect(model.privateKey.D)
            .toBe('110228008083699463012557553888442674049800736891640220747520328148544543761263');
    });

    test('export encryptd private key', () => {
        const xsdk = new XuperSDK({
            node,
            chain,
            preExecServer
        });

        xsdk.revertAccount(
            process.env.TEST_MNEMONIC || '',
            Language.SimplifiedChinese,
            Cryptography.EccFIPS
        );

        const address = xsdk.accountModel!.address;

        const encryptdPrivateKey = xsdk.exportAccount('1');

        expect(encryptdPrivateKey).toBe('RziKPHM0e6icCkXe0t5g1XCoXEorf/u5KNNV+l55LeWYgyD5aNySqIpnFwmr/WGegCjPZjv69x2CVbT/WkxAUM7G9ccZre7iJfULLzMzrp4Vf3lRqt6iP883fCcTGrgSxJeIQBYtTw1olrFdC9lXqhEfD94UuK04lrxXYN1HOTZHkg0oCJRUM1eECfYXwWVaPf9xZ59ZEh5/D5UYKKdBwKQbuRe22Hj/5I0N0WOzGoa86FUZusrv2lLjUxe0BscCCVZ1rvFdIMWuOCySYs4oNDLhnT6lD3FeXSZbO0cYC3s2dsXasAkSk5ioE9umtxoZxI/AQAdavLJtgeYkakNgzL+qBdL/CoqbtJEJgD/4ZIo=');

        const model = xsdk.importAccout('1', encryptdPrivateKey);

        expect(model.address).toEqual(address);
    });
});
