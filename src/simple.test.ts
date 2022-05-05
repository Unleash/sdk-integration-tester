import got from 'got';

const URL = process.env.SDK_URL || 'http://localhost:3000';

declare enum PayloadType {
    STRING = "string"
}
interface Payload {
    type: PayloadType;
    value: string;
}

interface IsEnabledResult {
    name: string;
    variant?: {
        name: string;
        enabled: boolean;
        payload?: Payload;
    };
    enabled: boolean;
    context: Map<string, string>;
}

describe.each([
    {toggleName: 'test-on',      userId: '123', enabled: true},
    {toggleName: 'test-on',      userId: '44',  enabled: false},
    {toggleName: 'test-off',     userId: '44',  enabled: false},
    {toggleName: 'test-gradual', userId: '44',  enabled: false},
    {toggleName: 'test-gradual', userId: '57',  enabled: false},
    {toggleName: 'test-gradual', userId: '56',  enabled: true},
  ])(`${URL}:isEnabled`, ({toggleName, userId, enabled}) => {
    test(`'${toggleName}' should be ${enabled ? 'enabled' : 'disabled'} for userId=${userId}`, async () => {
        const { body, statusCode } = await got.get(`${URL}/is-enabled/${toggleName}?userId=${userId}`);
    
        const data: IsEnabledResult = JSON.parse(body);
       
        expect(statusCode).toBe(200);
        expect(data.name).toBe(toggleName);
        expect(data.enabled).toBe(enabled);
    });
});


describe.each([
    {toggle: 'test-on',      userId: '123', variant: 'disabled'},
    {toggle: 'test-variant', userId: '123', variant: 'blue'},
    {toggle: 'test-variant', userId: '445', variant: 'red'},
    {toggle: 'test-variant', userId: '444', variant: 'blue'},
  ])(`${URL}:getVariant`, ({toggle, userId, variant}) => {
    test(`'${toggle}' should be ${variant} for userId=${userId}`, async () => {
        const { body, statusCode } = await got.get(`${URL}/variant/${toggle}?userId=${userId}`);
    
        const data: IsEnabledResult = JSON.parse(body);
       
        expect(statusCode).toBe(200);
        expect(data.name).toBe(toggle);
        expect(data.variant?.name).toBe(variant);
    });
});