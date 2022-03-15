// const crmodel = global.get("crmodel");
// const crUtils = global.get("crUtils");
// const crCache = crUtils.crCache;

const preStr = "变体" // 变体前缀
const flowCode = "P2P" // 默认flowCode


// 默认数据
let defaultData = [
    // { id: "id1", flowCode: "1", flowVariant: "", flowCase: "1", activity: "1", activityTime: 0, isReWork: 0 },
    // { id: "id2", flowCode: "1", flowVariant: "", flowCase: "2", activity: "3", activityTime: 1, isReWork: 0 },
    // { id: "id3", flowCode: "1", flowVariant: "", flowCase: "1", activity: "2", activityTime: 2, isReWork: 0 },
    // { id: "id4", flowCode: "1", flowVariant: "", flowCase: "1", activity: "1", activityTime: 3, isReWork: 0 },
]

// 读取csv
function readCsvToList(){
    let data = []
    try {
        let data_ = msg.req.files[0].buffer.toString().split("\n")

        for (let i = 1; i < data_.length; i++) {
            let item = data_[i].split(",")
            data.push({
                // id: item[0],
                // flowCode: "1",
                flowVariant: "",
                flowCase: item[0],
                activity: item[1],
                activityTime: item[2],
                // isReWork: 0
            })
        }
    } catch (e) {

    }
    return data
}

function main(){

    let detailData = data;
// let detailData = readCsvToList();
//     let detailData = data;
    detailData = checkData(detailData)

    // node.error(["detailData", detailData]);

// data = [
//     {
//         case_id: "",
//         activity:"",
//         process_time:"",
//         handler:"",
//         origan:""
//     }
// ]

// 获取所有flowCase的id
// let flowCase_ids = []
// for (let i = 0; i < detailData.length; i++) {
//     flowCase_ids.push(detailData[i].flowCase)
// }

    node.error(["checkData", detailData]);
    let flowCase_map = getCaseMap(detailData)
    let flowCodeVariant_map = getFlowCodeVariantMap(flowCase_map)
    flowCodeVariant_map = reNameVariantName(flowCodeVariant_map)

    node.error(["flowCase_map", flowCase_map])
    node.error(["flowCodeVariant_map", flowCodeVariant_map])

    node.error(["变体活动表", getCaseActivityList(flowCodeVariant_map)])
    node.error(["变体案例表", getVariantCaseList(flowCodeVariant_map)])
    node.error(["流程变体表", getFlowVariantList(flowCodeVariant_map)])
    node.error(["流程活动表", getFlowActivityList(flowCase_map)])

}










// 校验参数
function checkData(detailData = []) {
    let data = []
    for (let i = 0; i < detailData.length; i++) {
        let item = detailData[i];
        try {
            item.activityTime =  new Date(item.activityTime).valueOf();
            // console.log(item.activityTime, new Date(item.activityTime))
            data.push(item)
        } catch (e) {
            node.error(e)
        }
    }
    return data
}



/*
* 根据flowCase得到case map
*
* */
function getCaseMap(data = []) {
    let case_map = {}
    data.sort(function (a, b) {
        return a.activityTime - b.activityTime
    })
    for (let i = 0; i < data.length; i++) {
        let item = data[i];
        if (!item.flowCode) {
            item.flowCode = flowCode
        }

        let flowCase = item.flowCase
        if (!case_map[flowCase]) {
            case_map[flowCase] = {
                path_ids: [item.id],
                path_names: [item.activity],
                path: [item],
                time: 0,
                flowCode: item.flowCode,
                startTime: item.activityTime,
                endTime: item.activityTime,
                isReWork: false,
                flowCase: flowCase
            }
            continue
        }
        if (case_map[flowCase].path_names.includes(item.activity)){
            item.isReWork = true;
        }
        case_map[flowCase].path_ids.push(item.id)
        case_map[flowCase].path_names.push(item.activity)
        case_map[flowCase].path.push(item)
        case_map[flowCase]["time"] = item.activityTime - case_map[flowCase].path[0].activityTime
        case_map[flowCase].activityTime = item.activityTime
        case_map[flowCase].isReWork = item.isReWork || case_map[flowCase].isReWork
        case_map[flowCase].flowCase = item.flowCase
    }
    return case_map
}

function getFlowCodeVariantMap(flowCase_map = {}) {
    let flowCode_map = {}
    // let flowVariant_map = {}

    for (const flowCaseMapKey in flowCase_map) {
        let value = flowCase_map[flowCaseMapKey]
        let path_str = JSON.stringify(value.path_names)

        if (!flowCode_map[value.flowCode]) {
            flowCode_map[value.flowCode] = {}
        }
        let flowVariant_map = flowCode_map[value.flowCode]

        if (!flowVariant_map[path_str]) {
            flowVariant_map[path_str] = {
                flowCaseCount: 1,
                maxFlowCase: flowCaseMapKey,
                minFlowCase: flowCaseMapKey,
                minTime: value.time,
                maxTime: value.time,
                avgTime: value.time,
                flowCaseList: [value],
                path_ids: value.path_ids,
                path_names: value.path_names,
                path: value.path,
            }
            continue
        }
        flowVariant_map[path_str].flowCaseList.push(value)
        flowVariant_map[path_str].flowCaseCount += 1
        flowVariant_map[path_str].avgTime = (flowVariant_map[path_str].avgTime * (flowVariant_map[path_str].flowCaseCount - 1) + value.time) / flowVariant_map[path_str].flowCaseCount
        if (value.time > flowVariant_map[path_str].maxTime) {
            flowVariant_map[path_str].maxFlowCase = flowCaseMapKey
            flowVariant_map[path_str].maxTime = value.time
        }

        if (value.time < flowVariant_map[path_str].minTime) {
            flowVariant_map[path_str].minFlowCase = flowCaseMapKey
            flowVariant_map[path_str].minTime = value.time
        }

    }

    return flowCode_map

}

function reNameVariantName(flowCodeVariant_map) {
    for (const flowCodeVariantMapKey in flowCodeVariant_map) {
        if (flowCodeVariant_map.hasOwnProperty(flowCodeVariantMapKey)) {
            let flowVariant_map = flowCodeVariant_map[flowCodeVariantMapKey]
            let flowVariant_map_ = {}
            let index = 0
            for (const flowVariant in flowVariant_map) {
                if (flowVariant_map.hasOwnProperty(flowVariant)) {
                    flowVariant_map_[preStr + index] = flowVariant_map[flowVariant]
                    index++
                }
            }
            flowCodeVariant_map[flowCodeVariantMapKey] = flowVariant_map_
        }
    }
    return flowCodeVariant_map
}





// 流程活动表
function getFlowActivityList(flowCase_map) {
    let flowActivityList = [
        // {id: "1", FlowCode: "", activity: ""},
    ]
    for (const flowCaseMapKey in flowCase_map) {
        if (flowCase_map.hasOwnProperty(flowCaseMapKey)) {
            let value = flowCase_map[flowCaseMapKey]
            for (let i = 0; i < value.path_names.length; i++) {
                let item = {
                    flowCode: value.flowCode,
                    activity: value.path_names[i]
                }
                flowActivityList.push(item)
            }
        }
    }
    return flowActivityList
}
// 流程变体表
function getFlowVariantList(flowCodeVariant_map) {
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
    for (const flowCodeVariantMapKey in flowCodeVariant_map) {
        if (flowCodeVariant_map.hasOwnProperty(flowCodeVariantMapKey)) {
            let value = flowCodeVariant_map[flowCodeVariantMapKey]
            for (const valueKey in value) {
                if (value.hasOwnProperty(valueKey)) {
                    let value2 = value[valueKey]
                    let item = {
                        flowCode: flowCodeVariantMapKey,
                        flowVariant: valueKey,
                        flowCaseCount: value2.flowCaseCount,
                        maxFlowCase: value2.maxFlowCase,
                        maxTime: value2.maxTime,
                        minFlowCase: value2.minFlowCase,
                        minTime: value2.minTime
                    }
                    flowVariantList.push(item)
                }
            }
        }
    }
    return flowVariantList
}


// 变体案例表
function getVariantCaseList(flowCodeVariant_map) {
    let variantCaseList = [
        // {
        //     id: "",
        //     FlowCode: "",
        //     FlowVariant: "",
        //     FlowCase: "",
        //     startActivity: "",
        //     endActivity: "",
        //     caseTime: "",
        //     isReWork: ""
        // }
    ]
    //
    for (const flowCode in flowCodeVariant_map) {
        if (flowCodeVariant_map.hasOwnProperty(flowCode)) {
            let variantMap = flowCodeVariant_map[flowCode]
            for (const flowVariant in variantMap) {
                if (variantMap.hasOwnProperty(flowVariant)) {
                    let variant = variantMap[flowVariant]
                    for (let i = 0; i < variant.flowCaseList.length; i++) {
                        let flowCase = variant.flowCaseList[i]
                        let item = {
                            flowCode: flowCode,
                            flowVariant: flowVariant,
                            flowCase: flowCase.flowCase,
                            startActivity: flowCase.path[0].flowCase,
                            endActivity: flowCase.path[flowCase.path.length - 1].flowCase,
                            caseTime: flowCase.time,
                            isReWork: flowCase.isReWork
                        }
                        variantCaseList.push(item)

                    }
                }
            }
        }

    }
    return variantCaseList
}


// 变体活动表
function getCaseActivityList(flowCodeVariant_map) {
    let caseActivityList = [
        // {id: "", FlowCode: "", FlowVariant: "", activity: "", sequence: ""}
    ]
    for (const flowCode in flowCodeVariant_map) {
        if (flowCodeVariant_map.hasOwnProperty(flowCode)) {
            let variantMap = flowCodeVariant_map[flowCode]
            for (const flowVariant in variantMap) {
                if (variantMap.hasOwnProperty(flowVariant)) {
                    let variant = variantMap[flowVariant]
                    for (let i = 0; i < variant.path_names.length; i++) {
                        let item = {
                            flowCode: flowCode,
                            flowVariant: flowVariant,
                            activity: variant.path_names[i],
                            sequence: i,
                        }
                        caseActivityList.push(item)
                    }
                }

            }
        }
    }
    return caseActivityList
}


// return msg;