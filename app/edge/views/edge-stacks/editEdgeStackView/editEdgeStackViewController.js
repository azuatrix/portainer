import _ from 'lodash-es';
import { getEnvironments } from '@/react/portainer/environments/environment.service';
import { confirmWebEditorDiscard } from '@@/modals/confirm';
import { EnvironmentType } from '@/react/portainer/environments/types';
import { createWebhookId } from '@/portainer/helpers/webhookHelper';

export class EditEdgeStackViewController {
  /* @ngInject */
  constructor($async, $state, $window, EdgeGroupService, EdgeStackService, Notifications) {
    this.$async = $async;
    this.$state = $state;
    this.$window = $window;
    this.EdgeGroupService = EdgeGroupService;
    this.EdgeStackService = EdgeStackService;
    this.Notifications = Notifications;

    this.stack = null;
    this.edgeGroups = null;

    this.state = {
      actionInProgress: false,
      activeTab: 0,
      isStackDeployed: false,
    };

    this.formValues = {
      content: '',
    };

    this.deployStack = this.deployStack.bind(this);
    this.deployStackAsync = this.deployStackAsync.bind(this);
    this.getPaginatedEndpoints = this.getPaginatedEndpoints.bind(this);
    this.getPaginatedEndpointsAsync = this.getPaginatedEndpointsAsync.bind(this);
    this.onEditorChange = this.onEditorChange.bind(this);
    this.isEditorDirty = this.isEditorDirty.bind(this);
  }

  async $onInit() {
    return this.$async(async () => {
      const { stackId, tab } = this.$state.params;
      this.state.activeTab = tab;
      try {
        const [edgeGroups, model, file] = await Promise.all([this.EdgeGroupService.groups(), this.EdgeStackService.stack(stackId), this.EdgeStackService.stackFile(stackId)]);

        this.edgeGroups = edgeGroups;
        this.stack = model;
        this.stackEndpointIds = this.filterStackEndpoints(model.EdgeGroups, edgeGroups);
        this.originalFileContent = file;
        this.formValues = {
          content: file,
        };

        const stackEdgeGroups = model.EdgeGroups.map((id) => this.edgeGroups.find((e) => e.Id === id));
        const endpointTypes = stackEdgeGroups.flatMap((group) => group.EndpointTypes);
        const initiallyContainsKubeEnv = endpointTypes.includes(EnvironmentType.EdgeAgentOnKubernetes);
        const isComposeStack = this.stack.DeploymentType === 0;

        this.allowKubeToSelectCompose = initiallyContainsKubeEnv && isComposeStack;
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve stack data');
      }

      this.oldFileContent = this.formValues.StackFileContent;

      this.$window.onbeforeunload = () => {
        if (this.isEditorDirty()) {
          return '';
        }
      };
    });
  }

  $onDestroy() {
    this.$window.onbeforeunload = undefined;
  }

  async uiCanExit() {
    if (this.isEditorDirty()) {
      return confirmWebEditorDiscard();
    }
  }

  onEditorChange(content) {
    this.formValues.content = content;
  }

  isEditorDirty() {
    return !this.state.isStackDeployed && this.formValues.content.replace(/(\r\n|\n|\r)/gm, '') !== this.originalFileContent.replace(/(\r\n|\n|\r)/gm, '');
  }

  filterStackEndpoints(groupIds, groups) {
    return _.flatten(
      _.map(groupIds, (Id) => {
        const group = _.find(groups, { Id });
        return group.Endpoints;
      })
    );
  }

  deployStack(values) {
    return this.deployStackAsync(values);
  }

  async deployStackAsync(values) {
    this.state.actionInProgress = true;
    try {
      const updateVersion = !!(this.originalFileContent != values.content || values.useManifestNamespaces !== this.stack.UseManifestNamespaces);

      await this.EdgeStackService.updateStack(this.stack.Id, {
        stackFileContent: values.content,
        edgeGroups: values.edgeGroups,
        deploymentType: values.deploymentType,
        updateVersion,
        webhook: values.webhookEnabled ? this.stack.Webhook || createWebhookId() : '',
      });
      this.Notifications.success('Success', 'Stack successfully deployed');
      this.state.isStackDeployed = true;
      this.$state.go('edge.stacks');
    } catch (err) {
      this.Notifications.error('Deployment error', err, 'Unable to deploy stack');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  getPaginatedEndpoints(...args) {
    return this.$async(this.getPaginatedEndpointsAsync, ...args);
  }

  async getPaginatedEndpointsAsync(lastId, limit, search) {
    try {
      if (this.stackEndpointIds.length === 0) {
        return { endpoints: [], totalCount: 0 };
      }

      const query = { search, endpointIds: this.stackEndpointIds };
      const { value, totalCount } = await getEnvironments({ start: lastId, limit, query });

      return { endpoints: value, totalCount };
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve environment information');
    }
  }
}
