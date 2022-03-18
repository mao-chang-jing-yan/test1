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

        this.insert = {
            caseMap: {},
            variantMap: {},
            activities: [],
            tables: this._initTableList(),
        }

        this.update = {
            caseMap: {},
            variantMap: {},
            activities: [],
            tables: this._initTableList(),
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
        // await this.init(this.flowCode);
        // 获取新增变体名称的id的起始值
        // node.error([123]);
        this.index = await getMaxVariantName(this.flowCode) + 1;
        // 处理新增的数据得到caseMap
        this.caseMap = await this._caseMap(data);
        node.error(["this.caseMap", this.caseMap, Object.keys(this.caseMap)]);

        // 原始数据的caseMap
        this.caseMap_ = await this.getCaseMap_(Object.keys(this.caseMap));
        node.error(["this.caseMap_", this.caseMap_, Object.keys(this.caseMap_)]);
        // 检查caseMap是否需要更新
        let res = await this.checkCaseMap(this.caseMap, this.caseMap_);
        node.error(["checkCaseMap", res]);
        // 需要插入的case
        this.insert.caseMap = res.insertCaseMap;
        // 需要更新的case
        this.update.caseMap = res.updateCaseMap;


        // 有变化的case（变化之后）仅需要路径
        let newCaseMapTmp = this.mapAdd(this.update.caseMap, this.insert.caseMap);
        // node.error(["newCaseMapTmp", newCaseMapTmp]);

        // 数据库中存在的case 仅需要路径
        let oldCaseMapTmp = this.mapAdd({}, this.caseMap_);
        // oldCaseMapTmp = this.mapAdd(oldCaseMapTmp, this.caseMap_);
        // node.error(["oldCaseMapTmp", oldCaseMapTmp]);

        // 需要查询的case变化之后变体

        this.variantMap = await this._variantMap(newCaseMapTmp);
        node.error(["this.variantMap", this.variantMap, Object.keys(this.variantMap)]);
        // 需要查询的case变化之前变体
        let variantMap_ = await this.getVariantPathFromCaseMap(oldCaseMapTmp);
        // this.update.variantMap = await this._variantMap(this.update.caseMap);
        // 需要查询的变体
        let oldVariantMap = this.mapAdd(variantMap_, this.variantMap);
        node.error(["oldVariantMap", oldVariantMap, Object.keys(oldVariantMap)]);


        // 查询数据库中的变体信息
        let m1 = await this.getVariantMapWithPaths_(Object.keys(oldVariantMap));
        node.error(["m1", m1]);

        this.variantMap_ = m1.variantMap_;
        this.variantNameMap_ = m1.nameMap_;
        this.variantPathMap_ = m1.pathMap_;


        res = await this.checkVariantMap(this.variantMap, m1);
        node.error(["res", res]);

        this.insert.variantMap = res.insertVariantMap;
        this.update.variantMap = res.updateVariantMap;

        // // 重命名变体名称
        this._reNameVariantName(this.insert.variantMap, this.variantMap_);

        await this.handleInsertVariantMap(this.insert.variantMap, newCaseMapTmp, oldCaseMapTmp);
    }

    getVariantPathFromCaseMap(caseMap) {
        let m = {}
        for (const caseMapKey in caseMap) {
            if (caseMap.hasOwnProperty(caseMapKey)) {
                let key = caseMap[caseMapKey].pathStr;
                if (caseMap[caseMapKey].path_names) {
                    key = listToStr(caseMap[caseMapKey].path_names);
                }
                m[key] = 1
            }
        }
        return m;
    }

    mapAdd(map1, map2) {
        let m = {}
        for (const map2Key in map1) {
            if (map1.hasOwnProperty(map2Key)) {
                m[map2Key] = map1[map2Key]
            }
        }
        for (const map2Key in map2) {
            if (map2.hasOwnProperty(map2Key)) {
                m[map2Key] = map2[map2Key]
            }
        }
        return m;
    }

    async checkCaseMap(caseMap, caseMap_) {
        let insertCaseM = {};
        let updateCaseM = {};
        // node.error(["checkCaseMap", caseMap, caseMap_]);
        for (const flowCase in caseMap) {
            if (caseMap.hasOwnProperty(flowCase)) {
                if (!caseMap_[flowCase]) {
                    // insert
                    caseMap[flowCase].insert = true;
                    insertCaseM[flowCase] = caseMap[flowCase];
                    delete caseMap[flowCase];
                    continue
                }
                // update

                // path_ids: [item.id],
                // // 不变
                // flowCode: item.flowCode,
                // flowCase: flowCase,
                //
                // // 变化
                // startActivity: item.activity,
                // startTime: item.activityTime,
                // path_names: [item.activity],
                // path: [item],
                // time: 0,
                // endActivity: null,
                // endTime: item.activityTime,
                // isReWork: false,
                let oldCaseItem = JSON.parse(JSON.stringify(caseMap_[flowCase]));
                let newCaseItem = caseMap[flowCase];

                oldCaseItem.update = true;
                // oldCaseItem.path_ids = oldCaseItem.pathIdStr.split(";");
                oldCaseItem.path_names = oldCaseItem.pathStr.split(";");
                oldCaseItem.path_times = oldCaseItem.pathTimeStr.split(";");

                oldCaseItem.insertpath = [];
                await this.__insert(oldCaseItem, newCaseItem);

                if (!newCaseItem.insertpath || newCaseItem.insertpath.length <= 0) {
                    // delete caseMap[flowCase];
                    // continue
                } else {
                    node.error(["oldCaseItem.insertpath", oldCaseItem.insertpath]);
                }
                if (this.getTimeStamp(newCaseItem.startTime) < this.getTimeStamp(oldCaseItem.startTime)) {
                    oldCaseItem.startTime = newCaseItem.startTime;
                    oldCaseItem.startActivity = newCaseItem.startActivity;
                }
                if (this.getTimeStamp(newCaseItem.endTime) > this.getTimeStamp(oldCaseItem.endTime)) {
                    oldCaseItem.endTime = newCaseItem.endTime;
                    oldCaseItem.endActivity = newCaseItem.endActivity;
                }
                oldCaseItem.time = this.getTimeStamp(oldCaseItem.endTime) - this.getTimeStamp(oldCaseItem.startTime);
                // if (listToStr(oldCaseItem.path_names, ";") === "审批通过;审批通过;订单创建" || listToStr(oldCaseItem.path_names, ";")=== "订单创建;审批通过;审批通过"){
                //     node.error(["审批通过;审批通过;订单创建", caseMap_[flowCase], oldCaseItem, newCaseItem]);
                // }
                for (let i = 0; i < oldCaseItem.path_names.length; i++) {
                    if (oldCaseItem.isReWork) {
                        break;
                    }
                    oldCaseItem.isReWork = oldCaseItem.isReWork || newCaseItem.isReWork || oldCaseItem.path_names.includes(newCaseItem.path_names[i]);
                }


                updateCaseM[flowCase] = oldCaseItem;
                // delete caseMap[flowCase];
            }
        }
        return {
            insertCaseMap: insertCaseM,
            updateCaseMap: updateCaseM,
        }
    }

    async __insert(oldCaseItem, newCaseItem) {
        let i = 0, j = 0;
        while (i <= oldCaseItem.path_times.length && j < newCaseItem.path.length) {
            let time1 = oldCaseItem.path_times[i];
            let time2 = newCaseItem.path[j].activityTime;
            // node.error(["time ", time1, time2, this.getTimeStamp(time1), this.getTimeStamp(time2)]);
            if (i === oldCaseItem.path_times.length) {
                oldCaseItem.path_times.push(time2);
                oldCaseItem.path_names.push(newCaseItem.path[j].activity);
                oldCaseItem.insertpath.push(newCaseItem.path[j]);
                i++;
                j++;
                continue
            }
            if (this.getTimeStamp(time1) < this.getTimeStamp(time2)) {
                i++;
                continue
            }
            if (this.getTimeStamp(time1) > this.getTimeStamp(time2)) {
                oldCaseItem.path_times.splice(i, 0, time2);
                oldCaseItem.path_names.splice(i, 0, newCaseItem.path[j].activity);
                oldCaseItem.insertpath.push(newCaseItem.path[j]);
                j++
            }
            if (this.getTimeStamp(time1) === this.getTimeStamp(time2)) {
                for (let k = j + 1; k < newCaseItem.path.length; k++) {
                    if (this.getTimeStamp(time1) === this.getTimeStamp(newCaseItem.path[k].activityTime) && oldCaseItem.path_names[i] === newCaseItem.path[k].activity) {
                        newCaseItem.path.splice(k, 1);
                        // d.splice(k, 1);
                    }
                }
                i++;
            }
        }
        if (newCaseItem.path.length > 0) {
            newCaseItem.endTime = newCaseItem.path[newCaseItem.path.length - 1].activityTime;
            newCaseItem.endActivity = newCaseItem.path[newCaseItem.path.length - 1].activity;

            newCaseItem.startTime = newCaseItem.path[newCaseItem.path.length - 1].activityTime;
            newCaseItem.startActivity = newCaseItem.path[newCaseItem.path.length - 1].activity;
        }
        // oldCaseItem.insertpath = newCaseItem.path[j];
    }


    async checkVariantMap(variantMap, m) {
        let insertVariantM = {};
        let updateVariantM = {};
        let variantMap_ = m.variantMap_;
        let variantNameMap_ = m.nameMap_;
        let variantPathMap_ = m.pathMap_;

        for (const variantPath in variantMap) {
            if (variantMap.hasOwnProperty(variantPath)) {
                if (!variantPathMap_[variantPath]) {
                    variantMap[variantPath].insert = true;
                    insertVariantM[variantPath] = variantMap[variantPath];
                    continue
                }
                let oldVariant = JSON.parse(JSON.stringify(variantMap_[variantPath]));
                let newVariant = JSON.parse(JSON.stringify(variantMap[variantPath]));
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
                if (oldVariant.flowCaseCount !== newVariant.flowCaseCount) {
                    oldVariant.update = true;
                    oldVariant.flowCaseCount = newVariant.flowCaseCount;
                }

                if (oldVariant.maxTime < newVariant.maxTime) {
                    oldVariant.update = true;
                    oldVariant.maxTime = newVariant.maxTime;
                    oldVariant.maxFlowCase = newVariant.maxFlowCase;
                }
                if (oldVariant.minTime > newVariant.minTime) {
                    oldVariant.update = true;
                    oldVariant.minTime = newVariant.minTime;
                    oldVariant.minFlowCase = newVariant.minFlowCase;
                }
                if (oldVariant.update) {
                    updateVariantM[variantPath] = oldVariant;
                }
            }
        }
        return {
            insertVariantMap: insertVariantM,
            updateVariantMap: updateVariantM,
        }
    }


    async getCaseMap_(caseList = []) {
        let caseM = {};
        let data = await getCase(this.flowCode, caseList);
        for (let i = 0; i < data.length; i++) {
            let dataItem = data[i];
            // node.error([i, data[i], Object.keys(data[i].dataValues)]);
            let flowCase = dataItem.flowCase;
            if (flowCase && caseList.includes(flowCase)) {
                caseM[flowCase] = dataItem;
            }
        }
        node.error([data.length]);


        data = await getCaseWithActivity(this.flowCode, caseList);
        node.error([data.length]);

        for (let i = 0; i < data.length; i++) {
            let dataItem = data[i];
            // node.error([i, data[i], Object.keys(data[i].dataValues)]);
            let flowCase = dataItem.flowCase;
            if (flowCase && caseList.includes(flowCase)) {
                caseM[flowCase].pathStr = dataItem.pathStr;
                caseM[flowCase].pathTimeStr = dataItem.pathTimeStr;
            }
        }
        node.error([Object.keys(caseM)]);
        // node.error(["data - -- - ", data, caseM]);
        return caseM
    }

    async getVariantMapWithPaths_(paths = []) {
        let nameM = {};
        let pathM = {};
        let variantM = {};
        let data = await getWithPath(this.flowCode, JSON.parse(JSON.stringify(paths)));
        node.error(["getVariantMapWithPaths_ paths", paths, data]);
        for (let i = 0; i < data.length; i++) {
            let pathStr = data[i].pathStr;
            let flowVariant = data[i].flowVariant;
            // node.error(["flowVariant", pathStr, paths]);
            if (flowVariant && paths.includes(pathStr)) {
                nameM[flowVariant] = pathStr;
                pathM[pathStr] = flowVariant;
            }
        }

        data = await getFlowVariant(this.flowCode, Object.keys(nameM));
        node.error(["getFlowVariant data", data]);

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
        let caseActivityList = [
            // {id: "", FlowCode: "", FlowVariant: "", activity: "", sequence: ""}
        ]
        // 变体案例表
        let variantCaseList = [
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
        let flowVariantList = [
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
        let flowActivityList = [
            // {id: "1", FlowCode: "", activity: ""},
        ]

        // 活动详情表
        let activityDetailList = [
            // {flowCode: "", flowVariant: "", flowCase: "", activity: "", activityTime: "", endActivity: "", endTime: "",}
        ]
        return {
            caseActivityList: caseActivityList,
            variantCaseList: variantCaseList,
            flowVariantList: flowVariantList,
            flowActivityList: flowActivityList,
            activityDetailList: activityDetailList,
        }
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


    async handleInsertVariantMap(insertVariantMap, newCaseMap, oldCaseMap) {
        for (const flowVariant in insertVariantMap) {
            if (insertVariantMap.hasOwnProperty(flowVariant)) {
                let variant = insertVariantMap[flowVariant]
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
    _reNameVariantName(variantMap, variantMap_) {
        for (const variantMapKey in variantMap) {
            if (variantMap.hasOwnProperty(variantMapKey) && !variantMap_[variantMapKey]) {
                variantMap[preStr + this.index] = variantMap[variantMapKey];
                delete variantMap[variantMapKey];
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