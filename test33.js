const crmodel = global.get("crmodel");
const crUtils = global.get("crUtils");
const crCache = crUtils.crCache;
const sequelize = crmodel.sequelize;
const crsequelize = global.get("crsequelize").Sequelize;


function listToStr(list = []) {
    let str1 = ""
    for (let i = 0; i < list.length; i++) {
        if (i === list.length - 1) {
            str1 = str1 + list[i]
            break
        }
        str1 += list[i] + ";"
    }
    return str1
}

function pathsNamesToStr(paths) {
    let str2 = ""
    for (let i = 0; i < paths.length; i++) {
        let str1 = "\'" + paths[i] + "\'"
        // let str1 = listToStr(paths[i])
        paths[i] = str1
        if (!str2 && str1) {
            str2 += str1
            continue
        }
        if (str1) {
            str2 = str2 + "," + str1
        }
    }
    return str2
}

async function getTableName(app, model) {
    let m = await crmodel.parseModel(app, model);
    return await crUtils.getModelName(m.appId, m.modelId);
}

async function getFlowVariant(flowCode, flowVariantList) {
    let options = {
        where: {
            flowCode: flowCode,
        }
    }
    if (flowVariantList) {
        options.where.flowVariant = {
            [crmodel.Op.in]: flowVariantList,

        }
    }
    let data = await crmodel.findAll("pm", "flowVariant", options);
    node.error(["data", data]);
    return data;
}

async function getWithPath(flowCode, paths) {
    let pathStr = await pathsNamesToStr(paths);
    let tableName = await getTableName("pm", "variantActivity")
    let flowVariantColumn = await crmodel.getFieldId("pm", "variantActivity", "flowVariant");
    let flowCodeColumn = await crmodel.getFieldId("pm", "variantActivity", "flowCode");
    let activityColumn = await crmodel.getFieldId("pm", "variantActivity", "activity");
    let sequenceColumn = await crmodel.getFieldId("pm", "variantActivity", "sequence");

    let sql = `
    SELECT * FROM (
        SELECT u.${flowCodeColumn} as flowCode,u.${flowVariantColumn} as flowVariant, group_concat(u.${activityColumn} SEPARATOR ';') as pathStr
        from (
            select * from ${tableName} order by ${sequenceColumn}
            ) as u
        where u.${flowCodeColumn}=?
        GROUP BY u.${flowCodeColumn} ,u.${flowVariantColumn}
        ) AS T
        where T.pathStr IN(?)
    `

    // node.error([tableName, flowCodeColumn, sql, paths]);

    let options = {
        replacements: [flowCode, pathStr],
        type: crsequelize.QueryTypes.SELECT
    }
    let data = await sequelize.query(sql, options)
    node.error(["data", data]);

    return data;
}


async function getMaxVariantNameWithSameNumLength(flowCode, numLength) {
    if (numLength <= 0) {
        numLength = 1
    }
    let options = {
        order: [["flowVariant", "DESC"]],
        where: {
            flowCode: flowCode,
            flowVariant: {
                [crmodel.Op.and]: [
                    {[crmodel.Op.regexp]: '^变体[0-9]{' + numLength + '}$'},
                    // crsequelize.where(crsequelize.fn('char_length', 3))
                ]
            }

            // flowVariant: {[crmodel.Op.gt]: "变体10"}
        }
        // where: crsequelize.where(crsequelize.fn('char_length', crsequelize.col('flowVariant')), 3)
    }
    return await crmodel.findOne("pm", "flowVariant", options)
}

async function getMaxVariantName(flowCode) {
    let options = {offset: 0, limit: 1}
    let result = await crmodel._findAndCountAll("pm", "flowVariant", options);
    let count = result.count;
    let index = Math.floor(JSON.stringify(count).length)
    let data = await getMaxVariantNameWithSameNumLength(flowCode, index);
    let maxName = null;
    if (data) {
        while (data) {
            maxName = data.flowVariant
            data = await getMaxVariantNameWithSameNumLength(flowCode, ++index);
        }
    } else {
        while (index > 0 && !data) {
            data = await getMaxVariantNameWithSameNumLength(flowCode, --index);
            maxName = data.flowVariant
        }
    }

    index = 0
    if (maxName) {
        index = parseInt(maxName.split("变体")[1]);
    }

    // node.error(["getMaxVariantName", data, result, index, maxName]);
    return index;
}

// 1，caseid 已存在 2，caseid不存在
// 1，变体存在，2，变体不存在
class FlowVariant {
    constructor(flowCode) {
        this.beautifulRowDataAndSkip = this._defaultBeautifulRowDataAndSkip
        // 初始化数据
        this.init(flowCode)
    }

    init(flowCode) {
        this.flowCode = flowCode;
        this.index = 0;
        this._initTableList();

        this.insert = {
            caseMap: {},
            variantMap: {},
            activities: [],
        }

        this.update = {
            caseMap: {},
            variantMap: {},
            activities: [],
        }

        // 新增的
        this.caseMap = {};
        this.variantMap = {};
        this.activities = [];

        this.skipRows = [];
        this.skipRowIds = [];


        // 数据库中以存在的或上次以保存的
        this.caseMap_ = {};
        this.variantMap_ = {};
        this.variantNameMap_ = {};
        this.variantPathMap_ = {};
        this.activities_ = [];


    }

    // 处理数据
    async handleData(data) {
        // 获取新增变体名称的id的起始值
        this.index = await getMaxVariantName(this.flowCode) + 1;
        // 处理新增的数据得到caseMap
        this.caseMap = await this._caseMap(data);
        // 原始数据的caseMap
        this.caseMap_ = await this.getCaseMap_(this.caseMap);
        // 检查caseMap是否需要更新
        let res = await this.checkCaseMap(this.caseMap, this.caseMap_);
        this.insert.caseMap = res.insertCaseMap;
        this.update.caseMap = res.updateCaseMap;

        // 1, 处理需要插入的

        // 新增数据的变体map
        this.variantMap = await this._variantMap(this.caseMap);

        let m = await this.getVariantMap_(this.variantMap);

        this.variantMap_ = m.variantMap_;
        this.variantNameMap_ = m.nameMap_;
        this.variantPathMap_ = m.pathMap_;


        await this.checkVariantMap();

        // 重命名变体名称
        this._reNameVariantName();
    }

    async checkCaseMap(caseMap, caseMap_) {
        let insertCaseM = {};
        let updateCaseM = {};
        for (const flowCase in caseMap) {
            if (caseMap.hasOwnProperty(flowCase)) {
                if (!caseMap_.hasOwnProperty(flowCase)) {
                    // insert
                    insertCaseM[flowCase] = caseMap[flowCase];
                    delete caseMap[flowCase];
                    continue
                }
                // update
                updateCaseM[flowCase] = caseMap[flowCase];
                delete caseMap[flowCase];
            }
        }
        return{
            insertCaseMap: insertCaseM,
            updateCaseMap: updateCaseM,
        }
    }


    async checkVariantMap() {
        for (const variantPath in this.variantMap) {
            if (this.variantMap.hasOwnProperty(variantPath)) {
                if (!this.variantPathMap_[variantPath]) {
                    this.variantMap.insert = true;
                    continue
                }
                let oldVariant = this.variantMap_[variantPath];
                let newVariant = this.variantMap[variantPath];
                // {
                //     id: "",
                //     FlowCode: "",
                //     FlowVariant: "",
                //     FlowCaseCount: "",
                //     maxFlowCase: "",
                //     maxTime: "",
                //     minFlowCase: "",
                //     minTime: ""
                // }
                oldVariant.update = true
                oldVariant.flowCaseCount += newVariant.flowCaseCount;
                if (oldVariant.maxTime < newVariant.maxTime) {
                    oldVariant.maxTime = newVariant.maxTime;
                    oldVariant.maxFlowCase = newVariant.maxFlowCase;
                }
                if (oldVariant.minTime > newVariant.minTime) {
                    oldVariant.minTime = newVariant.minTime;
                    oldVariant.minFlowCase = newVariant.minFlowCase;
                }
            }
        }
    }


    async getCaseMap_(caseMap = {}) {
        let caseM = {}
        let data = await getCase(this.flowCode, Object.keys(caseMap));
        for (let i = 0; i < data.length; i++) {
            let flowCase = data[i].flowCase;
            caseMap[flowCase] = data[i];
        }
        return caseM
    }

    async getVariantMap_(variantMap = {}) {
        let nameM = {};
        let pathM = {};
        let variantM = {};
        let data = await getWithPath(this.flowCode, Object.keys(variantMap));
        for (let i = 0; i < data.length; i++) {
            let pathStr = data[i].pathStr;
            let flowVariant = data[i].flowVariant
            nameM[flowVariant] = pathStr
            pathM[pathStr] = flowVariant
        }
        data = await getFlowVariant(this.flowCode, Object.keys(nameM));
        for (let i = 0; i < data.length; i++) {
            let flowVariant = data[i].flowVariant;
            let pathStr = nameM[flowVariant];
            variantM[pathStr] = data[i];
        }
        return {
            nameMap_: nameM,
            pathMap_: pathM,
            variantMap_: variantM
        };
    }


    // deleteMap(m = {}){
    //     for (const key in m) {
    //         if (m.hasOwnProperty(key)){
    //             delete m[key]
    //         }
    //     }
    // }
    // clearAll(){
    //     this.deleteMap(this.caseMap);
    //     this.deleteMap(this.variantMap);
    //     this.data = []
    // }


    async getTables() {
        // this.handleCaseMap();
        // 流程活动表
        for (let i = 0; i < this.activities.length; i++) {
            let item = {
                flowCode: this.flowCode,
                activity: this.activities[i],
            }
            this.flowActivityList.push(item)
        }
        await this.handleVariantMap_();
        await this.handleVariantMap();
        return [
            // 变体活动表
            this.caseActivityList,
            // 变体案例表
            this.variantCaseList,
            // 流程变体表
            this.flowVariantList,
            // 流程活动表
            this.flowActivityList,
            // 活动详情表
            this.activityDetailList,
        ]
    }

    // 默认检查数据和判断是否跳过此条数据
    _defaultBeautifulRowDataAndSkip(index, item = {}) {
        try {
            let time1 = new Date(item.activityTime)
            if (isNaN(time1.valueOf()) || item.activityTime === undefined || item.activity === undefined || item.flowCase === undefined) {
                return true
            }
        } catch (e) {
            return true
        }
        return false
    }

    // 初始化数据表
    _initTableList() {
        // 变体活动表
        this.caseActivityList = [
            // {id: "", FlowCode: "", FlowVariant: "", activity: "", sequence: ""}
        ]
        // 变体案例表
        this.variantCaseList = [
            // {
            //     id: "",
            //     FlowCode: "",
            //     FlowVariant: "",
            //     FlowCase: "",
            //     startActivity: "",
            //     endActivity: "",
            //     startTime: "",
            //     endTime: "",
            //     caseTime: "",
            //     isReWork: ""
            // }
        ]
        // 流程变体表
        this.flowVariantList = [
            // {
            //     id: "",
            //     FlowCode: "",
            //     FlowVariant: "",
            //     FlowCaseCount: "",
            //     maxFlowCase: "",
            //     maxTime: "",
            //     minFlowCase: "",
            //     minTime: ""
            // }
        ]
        // 流程活动表
        this.flowActivityList = [
            // {id: "1", FlowCode: "", activity: ""},
        ]

        // 活动详情表
        this.activityDetailList = [
            // {flowCode: "", flowVariant: "", flowCase: "", activity: "", activityTime: "", endActivity: "", endTime: "",}
        ]
    }


    async handleVariantMap_() {
        for (const variantMapKey in this.variantMap_) {
            if (this.variantMap_.hasOwnProperty(variantMapKey)) {
                let item = this.variantMap_[variantMapKey]
                if (!item.update) {
                    continue
                }
                console.log("3")
            }
        }
    }

    // 处理variantMap 生成变体活动表、变体案例表、流程变体表
    async handleVariantMap() {
        for (const flowVariant in this.variantMap) {
            if (this.variantMap.hasOwnProperty(flowVariant)) {
                let variant = this.variantMap[flowVariant]
                if (!variant.insert) {
                    continue
                }
                // 变体活动表
                for (let i = 0; i < variant.path_names.length; i++) {
                    let caseActivityItem = {
                        flowCode: this.flowCode,
                        flowVariant: flowVariant,
                        activity: variant.path_names[i],
                        sequence: i,
                    }
                    this.caseActivityList.push(caseActivityItem)
                }

                // 变体案例表
                for (let i = 0; i < variant.flowCaseIdList.length; i++) {
                    let flowCaseId = variant.flowCaseIdList[i];
                    let flowCase = this.caseMap[flowCaseId];
                    let variantCaseItem = {
                        flowCode: this.flowCode,
                        flowVariant: flowVariant,
                        flowCase: flowCase.flowCase,
                        startActivity: flowCase.path[0].activity,
                        endActivity: flowCase.path[flowCase.path.length - 1].activity,
                        startTime: flowCase.path[0].activityTime,
                        endTime: flowCase.path[flowCase.path.length - 1].activityTime,
                        caseTime: flowCase.time,
                        isReWork: flowCase.isReWork
                    }
                    this.variantCaseList.push(variantCaseItem)

                    // 活动详情表
                    for (let j = 0; j < flowCase.path.length; j++) {
                        let nextIndex = j + 1;
                        let activityItem = flowCase.path[j];
                        activityItem.flowCode = this.flowCode;
                        activityItem.flowVariant = flowVariant;
                        if (nextIndex === flowCase.path.length) {
                            activityItem.endActivity = null;
                            activityItem.endTime = null;
                        } else {
                            activityItem.endActivity = flowCase.path[nextIndex].activity;
                            activityItem.endTime = flowCase.path[nextIndex].activityTime;
                        }
                        this.activityDetailList.push(activityItem);
                    }
                }

                // 流程变体表
                let item = {
                    flowCode: this.flowCode,
                    flowVariant: flowVariant,
                    flowCaseCount: variant.flowCaseCount,
                    maxFlowCase: variant.maxFlowCase,
                    maxTime: variant.maxTime,
                    minFlowCase: variant.minFlowCase,
                    minTime: variant.minTime,
                    avgTime: variant.avgTime,
                }
                this.flowVariantList.push(item)

            }
        }


    }


    // 重命名变体名称
    _reNameVariantName() {
        for (const variantMapKey in this.variantMap) {
            if (this.variantMap.hasOwnProperty(variantMapKey) && !this.variantMap_[variantMapKey]) {
                this.variantMap[preStr + this.index] = this.variantMap[variantMapKey];
                delete this.variantMap[variantMapKey];
                this.index++;
            }
        }
    }

    // 根据flowCase分组 获取每个case对应的变体信息
    async _caseMap(data) {
        let caseMap = {}
        for (let i = 0; i < data.length; i++) {
            let item = data[i];
            // 添加flowCode
            if (!item.flowCode) {
                item.flowCode = this.flowCode
            }
            // 是否跳过此条数据
            if (this.beautifulRowDataAndSkip(i, item)) {
                this.skipRows.push(item);
                this.skipRowIds.push(i);
                continue;
            }
            if (!this.activities.includes(item.activity)) {
                this.activities.push(item.activity);
            }

            let flowCase = item.flowCase
            if (!caseMap[flowCase]) {
                caseMap[flowCase] = {
                    path_ids: [item.id],
                    // 不变
                    flowCode: item.flowCode,
                    flowCase: flowCase,

                    // 变化
                    startActivity: item.activity,
                    startTime: item.activityTime,
                    path_names: [item.activity],
                    path: [item],
                    time: 0,
                    endActivity: null,
                    endTime: item.activityTime,
                    isReWork: false,
                }
                continue
            }

            if (caseMap[flowCase].path_names.includes(item.activity)) {
                item.isReWork = true;
            }

            if (caseMap[flowCase].path.length > 10) {
                // 二分法插入 如果时间相同 默认插入后面
                this._insert2(item, caseMap[flowCase].path, caseMap[flowCase].path_names, caseMap[flowCase].path_ids);
            } else {
                // 循环插入 如果时间相同 默认插入后面
                this._insert(item, caseMap[flowCase].path, caseMap[flowCase].path_names, caseMap[flowCase].path_ids);
            }


            caseMap[flowCase].startTime = caseMap[flowCase].path[0].startTime;
            caseMap[flowCase].startActivity = caseMap[flowCase].path[0].startActivity;

            let startTime = caseMap[flowCase].path[0].activityTime
            let time = this.getTimeStamp(item.activityTime) - this.getTimeStamp(startTime);
            if (time < 0) {
                time = 0;
            }
            caseMap[flowCase].time = time;
            caseMap[flowCase].endTime = item.activityTime;
            caseMap[flowCase].endActivity = item.activity;
            caseMap[flowCase].isReWork = item.isReWork || caseMap[flowCase].isReWork;
        }
        return caseMap;
    }

    getTimeStamp(timeStr) {
        return new Date(timeStr).valueOf()
    }

    // 循环插入 如果时间相同 默认插入后面
    _insert(item, path, path_names, path_ids) {
        let path_length = path.length;
        for (let j = 0; j < path_length; j++) {
            if (this.getTimeStamp(item.activityTime) < this.getTimeStamp(path[j].activityTime)) {
                path.splice(j, 0, item);
                path_names.splice(j, 0, item.activity);
                path_ids.splice(j, 0, item.id);
                break
            }
            if (j + 1 === path_length &&
                this.getTimeStamp(item.activityTime) >= this.getTimeStamp(path[j].activityTime)
            ) {
                path.push(item);
                path_names.push(item.activity);
                path_ids.push(item.id);
                break
            }
        }
    }

    // 二分法插入 如果时间相同 默认插入后面
    _insert2(item, path, path_names, path_ids) {
        let length = path.length
        if (length === 0 ||
            length >= 1 && this.getTimeStamp(path[length - 1].activityTime) <= this.getTimeStamp(item.activityTime)
        ) {
            path.push(item);
            path_names.push(item.activity);
            path_ids.push(item.id);
            return;
        }
        if (length >= 1 && this.getTimeStamp(path[0].activityTime) >= this.getTimeStamp(item.activityTime)) {
            path.unshift(item);
            path_names.unshift(item.activity);
            path_ids.unshift(item.id);
            return;
        }

        let left = 0, right = length - 1;
        while (left + 1 < right) {
            let middle = Math.floor((left + right) / 2)
            if (this.getTimeStamp(item.activityTime) >= this.getTimeStamp(path[middle].activityTime)) {
                left = middle;
            }
            if (this.getTimeStamp(item.activityTime) <= this.getTimeStamp(path[middle].activityTime)) {
                right = middle;
            }
        }
        // 如果时间相同插入后面
        while (this.getTimeStamp(path[right].activityTime) === this.getTimeStamp(item.activityTime) &&
        right + 1 < length) {
            if (this.getTimeStamp(path[right + 1].activityTime) === this.getTimeStamp(item.activityTime)) {
                right++;
            } else {
                right++;
                break
            }
        }
        path.splice(right, 0, item);
        path_names.splice(right, 0, item.activity);
        path_ids.splice(right, 0, item.id);
    }


    // 根据caseMap 按照变体路径 获取变体的信息
    async _variantMap(caseMap) {
        let variantMap = {}
        for (const flowCase in caseMap) {
            if (caseMap.hasOwnProperty(flowCase)) {
                let caseInfo = caseMap[flowCase];
                let pathStr = listToStr(caseInfo.path_names);
                if (!variantMap[pathStr]) {
                    variantMap[pathStr] = {
                        flowCaseCount: 1,
                        maxFlowCase: flowCase,
                        minFlowCase: flowCase,
                        minTime: caseInfo.time,
                        maxTime: caseInfo.time,
                        avgTime: caseInfo.time,
                        // flowCaseList: [caseInfo],
                        flowCaseIdList: [flowCase],
                        // path_ids: caseInfo.path_ids,
                        path_names: caseInfo.path_names,
                        // path: value.path,
                    }
                    continue
                }
                variantMap[pathStr].flowCaseIdList.push(flowCase);
                let oldCount = variantMap[pathStr].flowCaseCount;
                variantMap[pathStr].flowCaseCount = oldCount + 1;
                variantMap[pathStr].avgTime = (variantMap[pathStr].avgTime * oldCount + caseInfo.time) / variantMap[pathStr].flowCaseCount;

                if (caseInfo.time > variantMap[pathStr].maxTime) {
                    variantMap[pathStr].maxFlowCase = flowCase;
                    variantMap[pathStr].maxTime = caseInfo.time;
                }

                if (caseInfo.time < variantMap[pathStr].minTime) {
                    variantMap[pathStr].minFlowCase = flowCase;
                    variantMap[pathStr].minTime = caseInfo.time;
                }
            }
        }
        return variantMap
    }

}