from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Guild, GuildTag, GuildSocialLink, GuildMembership, GuildJoinRequest, GuildWarning

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'email']


class GuildTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuildTag
        fields = ['id', 'tag']


class GuildSocialLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuildSocialLink
        fields = ['id', 'platform_name', 'url']


class GuildMembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    approved_by = UserSerializer(read_only=True)
    
    class Meta:
        model = GuildMembership
        fields = [
            'id', 'user', 'role', 'status', 'is_active',
            'joined_at', 'approved_at', 'left_at', 'approved_by'
        ]


class GuildWarningSerializer(serializers.ModelSerializer):
    """Serializer for guild warnings"""
    issued_by = UserSerializer(read_only=True)
    dismissed_by = UserSerializer(read_only=True)
    is_active = serializers.SerializerMethodField()
    
    class Meta:
        model = GuildWarning
        fields = [
            'id', 'reason', 'issued_by', 'issued_at', 
            'dismissed_at', 'dismissed_by', 'is_active'
        ]
    
    def get_is_active(self, obj):
        return obj.is_active()


class GuildListSerializer(serializers.ModelSerializer):
    """Serializer for guild list view (minimal data)"""
    owner = UserSerializer(read_only=True)
    tags = GuildTagSerializer(many=True, read_only=True)
    active_warnings_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Guild
        fields = [
            'guild_id', 'name', 'description', 'specialization',
            'custom_emblem', 'preset_emblem', 'privacy', 'owner',
            'member_count', 'created_at', 'tags', 'minimum_level',
            'is_disabled', 'warning_count', 'active_warnings_count'
        ]
    
    def get_active_warnings_count(self, obj):
        return obj.get_active_warnings().count()


class GuildDetailSerializer(serializers.ModelSerializer):
    """Serializer for guild detail view (full data)"""
    owner = UserSerializer(read_only=True)
    tags = GuildTagSerializer(many=True, read_only=True)
    social_links = GuildSocialLinkSerializer(many=True, read_only=True)
    memberships = GuildMembershipSerializer(many=True, read_only=True)
    active_warnings = GuildWarningSerializer(many=True, read_only=True, source='get_active_warnings')
    active_warnings_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Guild
        fields = [
            'guild_id', 'name', 'description', 'specialization', 'welcome_message',
            'custom_emblem', 'preset_emblem', 'privacy', 'require_approval',
            'minimum_level', 'allow_discovery', 'show_on_home_page',
            'who_can_post_quests', 'who_can_invite_members', 'owner',
            'created_at', 'updated_at', 'member_count', 'tags',
            'social_links', 'memberships', 'is_disabled', 'warning_count',
            'disabled_at', 'disabled_by', 'disable_reason', 'active_warnings',
            'active_warnings_count'
        ]
    
    def get_active_warnings_count(self, obj):
        return obj.get_active_warnings().count()


class GuildCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating guilds"""
    tags = serializers.ListField(
        child=serializers.CharField(max_length=30),
        max_length=5,
        required=False,
        allow_empty=True,
        write_only=True
    )
    social_links = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True,
        write_only=True
    )
    
    class Meta:
        model = Guild
        fields = [
            'name', 'description', 'specialization', 'welcome_message',
            'custom_emblem', 'preset_emblem', 'privacy', 'require_approval',
            'minimum_level', 'allow_discovery', 'show_on_home_page',
            'who_can_post_quests', 'who_can_invite_members', 'tags', 'social_links'
        ]
    
    def to_representation(self, instance):
        """Override to handle related fields properly for response"""
        # Get base data from all non-related fields
        data = {}
        for field_name, field in self.fields.items():
            if not field.write_only:
                attribute = field.get_attribute(instance)
                if attribute is not None:
                    data[field_name] = field.to_representation(attribute)
                else:
                    data[field_name] = None
        
        # Add additional fields for response
        data['guild_id'] = str(instance.guild_id)
        data['created_at'] = instance.created_at.isoformat() if instance.created_at else None
        data['updated_at'] = instance.updated_at.isoformat() if instance.updated_at else None
        
        # Handle owner information
        if hasattr(instance, 'owner') and instance.owner:
            data['owner'] = {
                'id': instance.owner.id,
                'username': instance.owner.username,
                'first_name': instance.owner.first_name,
                'email': instance.owner.email
            }
        
        # Handle tags
        if hasattr(instance, 'tags'):
            data['tags'] = [tag.tag for tag in instance.tags.all()]
        
        # Handle social_links
        if hasattr(instance, 'social_links'):
            data['social_links'] = [
                {'platform_name': link.platform_name, 'url': link.url}
                for link in instance.social_links.all()
            ]
        
        # Add member count
        data['member_count'] = getattr(instance, 'member_count', 0)
        
        return data
    
    def validate_tags(self, value):
        if len(value) > 5:
            raise serializers.ValidationError("Maximum 5 tags allowed.")
        return value
    
    def validate_social_links(self, value):
        for link in value:
            if 'platform_name' not in link or 'url' not in link:
                raise serializers.ValidationError(
                    "Each social link must have 'platform_name' and 'url'."
                )
        return value
    
    def create(self, validated_data):
        tags_data = validated_data.pop('tags', [])
        social_links_data = validated_data.pop('social_links', [])
        
        # Owner should be set by the view's perform_create method
        # If not set, get from request context
        if 'owner' not in validated_data:
            validated_data['owner'] = self.context['request'].user
        
        guild = Guild.objects.create(**validated_data)
        
        # Create tags
        for tag in tags_data:
            GuildTag.objects.create(guild=guild, tag=tag)
        
        # Create social links
        for link_data in social_links_data:
            GuildSocialLink.objects.create(
                guild=guild,
                platform_name=link_data['platform_name'],
                url=link_data['url']
            )
        
        # Create owner membership
        GuildMembership.objects.create(
            guild=guild,
            user=guild.owner,
            role='owner',
            status='approved',
            is_active=True
        )
        
        return guild
    
    def update(self, instance, validated_data):
        tags_data = validated_data.pop('tags', None)
        social_links_data = validated_data.pop('social_links', None)
        
        # Update guild instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update tags if provided
        if tags_data is not None:
            instance.tags.all().delete()
            for tag in tags_data:
                GuildTag.objects.create(guild=instance, tag=tag)
        
        # Update social links if provided
        if social_links_data is not None:
            instance.social_links.all().delete()
            for link_data in social_links_data:
                GuildSocialLink.objects.create(
                    guild=instance,
                    platform_name=link_data['platform_name'],
                    url=link_data['url']
                )
        
        return instance


class GuildJoinRequestSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    guild = GuildListSerializer(read_only=True)
    processed_by = UserSerializer(read_only=True)
    
    class Meta:
        model = GuildJoinRequest
        fields = [
            'id', 'guild', 'user', 'message', 'created_at',
            'processed_at', 'processed_by', 'is_approved'
        ]
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
